'use client'

import { useState, useEffect } from 'react'
import ServiceLocationFilter from '@/components/ServiceLocationFilter'
import ServicePrice from '@/components/services/ServicePrice'
import { Search, MapPin, Heart, Star, Filter } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation, CurrencyCode } from '@/types/database'
import { isServiceWithinRadius } from '@/lib/utils/distance'
import { useAuth } from '@/hooks/useAuth'
import { getLocalizedServicesUrl } from '@/lib/utils/localized-urls'

interface ServicesPageProps {
  params: {
    locale: string
    services: string
  }
}

type ServiceWithFundraiser = Service & {
  users: {
    id: string
    name: string
  }
}

interface LocationFilter {
  type: 'all' | 'remote' | 'physical' | 'hybrid'
  location?: { lat: number; lng: number }
  radius?: number
}

type PlatformFilter = 'all' | 'justgiving' | 'everyorg'

export default function ServicesPageContent({ params }: ServicesPageProps) {
  const locale = params.locale
  const servicesSlug = params.services
  
  // Validate that the services slug matches the expected translation for this locale
  const expectedServicesSlug = locale === 'tr' ? 'hizmetler' : 'services'
  
  // Redirect to 404 if the services slug doesn't match the locale
  if (servicesSlug !== expectedServicesSlug) {
    throw new Error('Not Found')
  }
  const { user } = useAuth()
  const [services, setServices] = useState<ServiceWithFundraiser[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceWithFundraiser[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({ type: 'all' })
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all')
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('AUD')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showSwipeHint, setShowSwipeHint] = useState(true)
  
  // Touch gesture handling
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  
  // Platform navigation sequence
  const platformSequence = ['PoweredByDonation', 'justgiving', 'everyorg', 'acnc']
  const platformRoutes = {
    PoweredByDonation: `/${locale}/PoweredByDonation/services`,
    justgiving: `/${locale}/justgiving/charities`,
    everyorg: `/${locale}/everyorg/nonprofits`,
    acnc: `/${locale}/acnc/charities`
  }
  
  // Minimum distance for swipe detection (in pixels)
  const minSwipeDistance = 50
  
  // Handle touch start
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null) // Reset touch end
    setTouchStart(e.targetTouches[0].clientX)
  }
  
  // Handle touch move
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }
  
  // Handle touch end and detect swipe
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    // Hide swipe hint on first touch
    if (showSwipeHint) {
      setShowSwipeHint(false)
    }
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe || isRightSwipe) {
      handlePlatformSwipe(isLeftSwipe ? 'left' : 'right')
    }
  }
  
  // Handle platform navigation via swipe
  const handlePlatformSwipe = (direction: 'left' | 'right') => {
    const currentPlatformKey = 'PoweredByDonation' // We're on services page
    const currentIndex = platformSequence.indexOf(currentPlatformKey)
    let nextIndex
    
    if (direction === 'left') {
      // Swipe left = next platform
      nextIndex = (currentIndex + 1) % platformSequence.length
    } else {
      // Swipe right = previous platform
      nextIndex = (currentIndex - 1 + platformSequence.length) % platformSequence.length
    }
    
    const nextPlatform = platformSequence[nextIndex]
    const nextRoute = platformRoutes[nextPlatform as keyof typeof platformRoutes]
    
    // Navigate to next platform
    window.location.href = nextRoute
  }
  const [showMobileLocationMap, setShowMobileLocationMap] = useState(false)
  
  // Mobile filter selections state
  const [mobileFilters, setMobileFilters] = useState({
    search: searchQuery,
    platform: platformFilter,
    location: locationFilter
  })

  useEffect(() => {
    // Load messages
    async function loadMessages() {
      try {
        const msgs = (await import(`../messages/${locale}.json`)).default
        setMessages(msgs)
      } catch (error) {
        // Fallback to English
        const msgs = (await import(`../messages/en.json`)).default
        setMessages(msgs)
      }
    }


    // Fetch user's preferences
    async function fetchUserPreferences() {
      if (!user) return
      
      const supabase = createClient()
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('preferred_currency')
          .eq('id', user.id)
          .single()
        
        if (userProfile?.preferred_currency) {
          setUserCurrency(userProfile.preferred_currency)
        }
      } catch (err) {
        // Default currency already set
      }
    }

    loadMessages()
    fetchUserPreferences()
  }, [locale, user])

  // Fetch all services regardless of platform
  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          users (
            id,
            name
          )
        `)
        .eq('is_active', true)
        .eq('show_in_directory', true)
        .order('created_at', { ascending: false })

      if (error) {
        setServices([])
      } else {
        const servicesData = data || []
        setServices(servicesData)
        setFilteredServices(servicesData)
      }
      
      setLoading(false)
    }
    
    fetchServices()
  }, [])

  // Filter services based on search query, platform, and location filter
  useEffect(() => {
    let filtered = services

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        service =>
          service.title.toLowerCase().includes(query) ||
          service.description?.toLowerCase().includes(query) ||
          service.users.name.toLowerCase().includes(query)
      )
    }

    // Apply platform filter
    if (platformFilter !== 'all') {
      filtered = filtered.filter(service => service.platform === platformFilter)
    }

    // Apply location filter
    if (locationFilter.type !== 'all') {
      filtered = filtered.filter(service => {
        const serviceLocations = Array.isArray(service.service_locations) 
          ? service.service_locations as ServiceLocation[]
          : []
        
        if (serviceLocations.length === 0) {
          return false
        }

        const serviceLocation = serviceLocations[0]
        
        // Filter by location type
        if (locationFilter.type === 'remote') {
          return serviceLocation.type === 'remote'
        }
        
        if (locationFilter.type === 'physical') {
          return serviceLocation.type === 'physical'
        }
        
        if (locationFilter.type === 'hybrid') {
          return serviceLocation.type === 'hybrid'
        }
        
        return false
      })

      // Apply proximity filter for physical and hybrid services
      if ((locationFilter.type === 'physical' || locationFilter.type === 'hybrid') && 
          locationFilter.location && locationFilter.radius) {
        filtered = filtered.filter(service => {
          const serviceLocations = Array.isArray(service.service_locations)
            ? service.service_locations as ServiceLocation[]
            : []
          if (serviceLocations.length === 0) {
            return false
          }

          const serviceLocation = serviceLocations[0]
          
          return isServiceWithinRadius(
            locationFilter.location!,
            {
              latitude: serviceLocation.latitude,
              longitude: serviceLocation.longitude,
              type: serviceLocation.type
            },
            locationFilter.radius!
          )
        })
      }
    }

    setFilteredServices(filtered)
  }, [services, searchQuery, platformFilter, locationFilter])

  // Auto-hide swipe hint after 3 seconds
  useEffect(() => {
    if (showSwipeHint) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showSwipeHint])

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  // Mobile filter functions
  const openMobileFilters = () => {
    setMobileFilters({
      search: searchQuery,
      platform: platformFilter,
      location: locationFilter
    })
    setShowMobileFilters(true)
  }

  const applyMobileFilters = () => {
    setSearchQuery(mobileFilters.search)
    setPlatformFilter(mobileFilters.platform)
    setLocationFilter(mobileFilters.location)
    setShowMobileFilters(false)
  }

  const clearMobileFilters = () => {
    setMobileFilters({
      search: '',
      platform: 'all',
      location: { type: 'all' }
    })
  }

  const handleMobileLocationTypeChange = (type: LocationFilter['type']) => {
    if (type === 'physical' || type === 'hybrid') {
      // First update the location type in the state
      setMobileFilters(prev => ({ ...prev, location: { type } }))
      // Then show location map modal for location/radius selection
      setShowMobileLocationMap(true)
    } else {
      // Direct selection for all/remote
      setMobileFilters(prev => ({ ...prev, location: { type } }))
    }
  }

  const handleMobileLocationMapChange = (location: LocationFilter) => {
    setMobileFilters(prev => ({ ...prev, location }))
    // Don't automatically close the modal - let user click "Done" when ready
  }

  // Helper function to get location display
  const getLocationDisplay = (locations: any) => {
    if (!Array.isArray(locations) || locations.length === 0) {
      return 'Location TBD'
    }
    
    const location = locations[0] as ServiceLocation
    switch (location.type) {
      case 'remote':
        return 'Remote'
      case 'hybrid':
        return 'Hybrid'
      case 'physical':
        return location.area || 'Physical'
      default:
        return 'Location TBD'
    }
  }


  return (
    <div 
      className="min-h-screen bg-white"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Page Header */}
          <div className="mb-8">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              Showing {filteredServices.length.toLocaleString()} services
            </div>
            <h2 className="text-lg font-semibold text-gray-700">
              {messages.services?.browse?.title || 'Browse Services'}
            </h2>
          </div>

          {/* Search and Filters - Hidden on mobile */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">

            {/* Search Bar - Top Row */}
            <div className="mb-6">
              <div className="relative w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={messages.common?.search || 'Search services...'}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Platform Filter - Second Row */}
            <div className="mb-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">Platform</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPlatformFilter('all')}
                    className={`flex items-center justify-center p-3 min-h-16 rounded-lg border transition-colors ${
                      platformFilter === 'all'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">All ({services.length})</span>
                  </button>
                  <button
                    onClick={() => setPlatformFilter('justgiving')}
                    className={`flex items-center justify-center p-3 min-h-16 rounded-lg border transition-colors ${
                      platformFilter === 'justgiving'
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">JustGiving ({services.filter(s => s.platform === 'justgiving').length})</span>
                  </button>
                  <button
                    onClick={() => setPlatformFilter('everyorg')}
                    className={`flex items-center justify-center p-3 min-h-16 rounded-lg border transition-colors ${
                      platformFilter === 'everyorg'
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-sm font-medium">Every.org ({services.filter(s => s.platform === 'everyorg').length})</span>
                  </button>
                </div>
              </div>
            </div>
              
            {/* Location Filter - Third Row */}
            <div>
              <ServiceLocationFilter 
                onFilterChange={setLocationFilter}
                services={services.map(service => ({
                  id: service.id,
                  title: service.title,
                  service_locations: Array.isArray(service.service_locations) 
                    ? service.service_locations as ServiceLocation[]
                    : []
                }))}
              />
            </div>
          </div>

          {/* Filter Summary */}
          {(locationFilter.type !== 'all' || platformFilter !== 'all' || searchQuery.trim()) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    Showing {filteredServices.length} of {services.length} services
                  </span>
                  {searchQuery.trim() && (
                    <span className="text-sm text-blue-700">
                      matching "{searchQuery}"
                    </span>
                  )}
                  {platformFilter !== 'all' && (
                    <span className="text-sm text-blue-700">
                      • {platformFilter === 'justgiving' ? 'JustGiving' : 'Every.org'} services
                    </span>
                  )}
                  {locationFilter.type !== 'all' && (
                    <span className="text-sm text-blue-700">
                      • {locationFilter.type === 'remote' && 'Remote services'}
                      {locationFilter.type === 'physical' && 'In-person services'}
                      {locationFilter.type === 'hybrid' && 'Hybrid services'}
                      {locationFilter.location && locationFilter.radius && 
                        ` within ${locationFilter.radius}km`
                      }
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setPlatformFilter('all')
                    setLocationFilter({ type: 'all' })
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
                </button>
              </div>
            </div>
          )}

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading services...</p>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {services.length === 0 ? 'No services available' : 'No matching services'}
                </h3>
                <p className="text-gray-500">
                  {services.length === 0 
                    ? 'Be the first to create a service and help charities!'
                    : 'Try adjusting your search or location filters to find more services.'
                  }
                </p>
              </div>
            ) : (
              filteredServices.map((service) => (
              <a 
                key={service.id} 
                href={`/${locale}/PoweredByDonation/${expectedServicesSlug}/${generateSlug(service.title)}`}
                className="block bg-gradient-to-br from-blue-50 via-white to-white border border-blue-200 border-l-4 border-l-blue-500 rounded-lg shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-200 overflow-hidden cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 transition-colors">
                        {service.title}
                      </h3>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          service.platform === 'justgiving' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {service.platform === 'justgiving' ? 'JustGiving' : 'Every.org'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description || 'No description provided'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">{messages.services?.browse?.fundraiser || 'Fundraiser'}:</span>
                      <span className="ml-1">{service.users.name}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {getLocationDisplay(service.service_locations)}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="h-3 w-3 mr-1" />
                      {service.charity_requirement_type === 'any_charity' ? 'Any Charity' : 'Specific Charities'}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <ServicePrice
                      pricingTierId={service.pricing_tier_id}
                      userCurrency={userCurrency}
                      className="text-2xl font-bold text-blue-600"
                    />
                  </div>
                </div>
              </a>
              ))
            )}
          </div>

          {/* Community Impact Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {messages.services?.browse?.communityImpact?.title || 'Community Impact'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{filteredServices.length}</div>
                <div className="text-sm text-gray-500">
                  {locationFilter.type === 'all' 
                    ? (messages.services?.browse?.communityImpact?.activeServices || 'Active Services')
                    : 'Matching Services'
                  }
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {new Set(filteredServices.map(service => service.charity_requirement_type)).size === 1 && 
                   filteredServices[0]?.charity_requirement_type === 'any_charity' ? 'Any' : 'Multiple'}
                </div>
                <div className="text-sm text-gray-500">
                  Charity Options
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {new Set(filteredServices.map(service => service.users.id)).size}
                </div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.activeFundraisers || 'Active Fundraisers'}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              {messages.services?.browse?.communityImpact?.donationsNote || 'All donations go directly to registered charities via JustGiving'}
            </p>
          </div>

          {/* Call to Action for Fundraisers */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {messages.services?.browse?.callToAction?.title || 'Want to offer your services?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {messages.services?.browse?.callToAction?.description || 'Join our community of fundraisers and help charities while showcasing your skills.'}
            </p>
            <a 
              href={`/${locale}/dashboard`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              {messages.services?.browse?.callToAction?.button || 'Get Started'}
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden fixed bottom-24 right-6 z-50">
        <button
          onClick={openMobileFilters}
          className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50"
          aria-label="Open service filters"
        >
          <Filter className="h-5 w-5" />
        </button>
      </div>

      {/* Swipe Hint - Shows briefly on mobile */}
      {showSwipeHint && (
        <div className="md:hidden fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
          <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm animate-pulse">
            ← Swipe to switch platforms →
          </div>
        </div>
      )}

      {/* Mobile Filter Modal */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Filter Services</h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={clearMobileFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Search Bar */}
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={mobileFilters.search}
                    onChange={(e) => setMobileFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="🔍 Search services, fundraisers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <div className="relative">
                  <select
                    value={mobileFilters.platform}
                    onChange={(e) => setMobileFilters(prev => ({ ...prev, platform: e.target.value as PlatformFilter }))}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">💼 All Platforms</option>
                    <option value="justgiving">🟣 JustGiving</option>
                    <option value="everyorg">🟢 Every.org</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <div className="relative">
                  <select
                    value={mobileFilters.location.type}
                    onChange={(e) => handleMobileLocationTypeChange(e.target.value as LocationFilter['type'])}
                    className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">🌏 All Locations</option>
                    <option value="remote">💻 Remote</option>
                    <option value="physical">📍 In-Person{mobileFilters.location.type === 'physical' && mobileFilters.location.location && ` (${mobileFilters.location.radius}km)`}</option>
                    <option value="hybrid">🔄 Hybrid{mobileFilters.location.type === 'hybrid' && mobileFilters.location.location && ` (${mobileFilters.location.radius}km)`}</option>
                  </select>
                  <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Modal Footer - Apply Filters Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={applyMobileFilters}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Location Map Modal */}
      {showMobileLocationMap && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-full h-full flex flex-col">
            {/* Modal Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Set Location & Radius</h2>
                <button
                  onClick={() => setShowMobileLocationMap(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Location Map Interface */}
            <div className="flex-1 overflow-y-auto">
              {/* Instructions */}
              <div className="p-2 bg-blue-50 border-b">
                <p className="text-xs text-blue-800">
                  📍 Tap map & set radius to find nearby services
                </p>
              </div>

              {/* Real Map Component for Mobile */}
              <div className="p-2">
                <ServiceLocationFilter 
                  onFilterChange={handleMobileLocationMapChange}
                  services={services.map(service => ({
                    id: service.id,
                    title: service.title,
                    service_locations: Array.isArray(service.service_locations) 
                      ? service.service_locations as ServiceLocation[]
                      : []
                  }))}
                  className="h-full min-h-[300px]"
                  forceShowMap={true}
                  initialType={mobileFilters.location.type === 'hybrid' || mobileFilters.location.type === 'physical' ? mobileFilters.location.type : 'physical'}
                  hideTypeSelector={true}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-white border-t flex-shrink-0">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMobileLocationMap(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Close location modal and return to main filter modal
                    setShowMobileLocationMap(false)
                  }}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp-style Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-4 py-2">
          {/* Services (PD) - Active for this page */}
          <Link
            href={`/${locale}/PoweredByDonation/services`}
            className="flex flex-col items-center py-2 px-1 text-purple-600 bg-purple-50"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 bg-purple-600 text-white">
              PD
            </div>
            <span className="text-xs font-medium">Services</span>
          </Link>

          {/* JustGiving */}
          <Link
            href={`/${locale}/justgiving/charities`}
            className="flex flex-col items-center py-2 px-1 text-gray-400"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-gray-300">
              <img
                src="/flags/1x1/gb.svg"
                alt="UK"
                className="w-4 h-4 rounded-sm"
              />
            </div>
            <span className="text-xs font-medium">JustGiving</span>
          </Link>

          {/* Every.org */}
          <Link
            href={`/${locale}/everyorg/nonprofits`}
            className="flex flex-col items-center py-2 px-1 text-gray-400"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-gray-300">
              <img
                src="/flags/1x1/us.svg"
                alt="US"
                className="w-4 h-4 rounded-sm"
              />
            </div>
            <span className="text-xs font-medium">Every.org</span>
          </Link>

          {/* ACNC */}
          <Link
            href={`/${locale}/acnc/charities`}
            className="flex flex-col items-center py-2 px-1 text-gray-400"
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center mb-1 bg-gray-300">
              <img
                src="/flags/1x1/au.svg"
                alt="AU"
                className="w-4 h-4 rounded-sm"
              />
            </div>
            <span className="text-xs font-medium">ACNC</span>
          </Link>
        </div>
      </div>
    </div>
  )
}