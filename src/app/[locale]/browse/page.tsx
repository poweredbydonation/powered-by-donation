'use client'

import { useState, useEffect } from 'react'
import ServiceLocationFilter from '@/components/ServiceLocationFilter'
import ServicePrice from '@/components/services/ServicePrice'
import { Search, MapPin, Heart, Star, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation, CurrencyCode } from '@/types/database'
import { isServiceWithinRadius } from '@/lib/utils/distance'
import { useAuth } from '@/hooks/useAuth'

interface BrowsePageProps {
  params: {
    locale: string
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

export default function BrowsePage({ params }: BrowsePageProps) {
  const locale = params.locale
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
        const msgs = (await import(`../../../messages/${locale}.json`)).default
        setMessages(msgs)
      } catch (error) {
        // Fallback to English
        const msgs = (await import(`../../../messages/en.json`)).default
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
      // For physical/hybrid services, show location map modal
      // The ServiceLocationFilter component will handle the map interface
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
    <div className="min-h-screen bg-white">
      
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {messages.services?.browse?.title || 'Browse Services'}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {messages.services?.browse?.subtitle || 'Find professional services and support charities'}
            </p>
          </div>

          {/* Search and Filters - Hidden on mobile */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 space-y-6">

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={messages.common?.search || 'Search services, fundraisers, or descriptions...'}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setPlatformFilter('all')}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    platformFilter === 'all'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  All Platforms ({services.length})
                </button>
                <button
                  onClick={() => setPlatformFilter('justgiving')}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    platformFilter === 'justgiving'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  JustGiving ({services.filter(s => s.platform === 'justgiving').length})
                </button>
                <button
                  onClick={() => setPlatformFilter('everyorg')}
                  className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                    platformFilter === 'everyorg'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Every.org ({services.filter(s => s.platform === 'everyorg').length})
                </button>
              </div>
            </div>
            
            {/* Location Filter */}
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
                href={`/${locale}/services/${generateSlug(service.title)}`}
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
                    {/* Remove rating for now since we don't have happiness ratings yet */}
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
      <div className="md:hidden fixed bottom-6 right-6 z-50">
        <button
          onClick={openMobileFilters}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <Filter className="h-6 w-6" />
        </button>
      </div>

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
            <div className="p-4 space-y-6">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={mobileFilters.search}
                    onChange={(e) => setMobileFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search services, fundraisers..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      checked={mobileFilters.platform === 'all'}
                      onChange={() => setMobileFilters(prev => ({ ...prev, platform: 'all' }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Platforms</span>
                  </label>
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      checked={mobileFilters.platform === 'justgiving'}
                      onChange={() => setMobileFilters(prev => ({ ...prev, platform: 'justgiving' }))}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">JustGiving</span>
                  </label>
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-green-50 cursor-pointer">
                    <input
                      type="radio"
                      name="platform"
                      checked={mobileFilters.platform === 'everyorg'}
                      onChange={() => setMobileFilters(prev => ({ ...prev, platform: 'everyorg' }))}
                      className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Every.org</span>
                  </label>
                </div>
              </div>

              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="location"
                      checked={mobileFilters.location.type === 'all'}
                      onChange={() => handleMobileLocationTypeChange('all')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">All Locations</span>
                  </label>
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input
                      type="radio"
                      name="location"
                      checked={mobileFilters.location.type === 'remote'}
                      onChange={() => handleMobileLocationTypeChange('remote')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Remote</span>
                  </label>
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input
                      type="radio"
                      name="location"
                      checked={mobileFilters.location.type === 'physical'}
                      onChange={() => handleMobileLocationTypeChange('physical')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      In-Person
                      {mobileFilters.location.type === 'physical' && mobileFilters.location.location && 
                        ` (${mobileFilters.location.radius}km radius)`
                      }
                    </span>
                  </label>
                  <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer">
                    <input
                      type="radio"
                      name="location"
                      checked={mobileFilters.location.type === 'hybrid'}
                      onChange={() => handleMobileLocationTypeChange('hybrid')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Hybrid
                      {mobileFilters.location.type === 'hybrid' && mobileFilters.location.location && 
                        ` (${mobileFilters.location.radius}km radius)`
                      }
                    </span>
                  </label>
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
              <div className="p-4 bg-blue-50 border-b">
                <p className="text-sm text-blue-800">
                  Tap on the map to set your location, then adjust the radius to find {mobileFilters.location.type} services near you.
                </p>
              </div>

              {/* Real Map Component for Mobile */}
              <div className="p-4">
                <ServiceLocationFilter 
                  onFilterChange={handleMobileLocationMapChange}
                  services={services.map(service => ({
                    id: service.id,
                    title: service.title,
                    service_locations: Array.isArray(service.service_locations) 
                      ? service.service_locations as ServiceLocation[]
                      : []
                  }))}
                  className="min-h-[500px]"
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
    </div>
  )
}