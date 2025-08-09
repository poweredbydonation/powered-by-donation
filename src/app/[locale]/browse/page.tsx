'use client'

import { useState, useEffect } from 'react'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import ServiceLocationFilter from '@/components/ServiceLocationFilter'
import ServicePrice from '@/components/services/ServicePrice'
import { Search, MapPin, Heart, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation, CurrencyCode, DonationPlatform } from '@/types/database'
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

export default function BrowsePage({ params }: BrowsePageProps) {
  const locale = params.locale
  const { user } = useAuth()
  const [services, setServices] = useState<ServiceWithFundraiser[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceWithFundraiser[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState<LocationFilter>({ type: 'all' })
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('AUD')
  const [userPlatform, setUserPlatform] = useState<DonationPlatform | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<DonationPlatform>('justgiving')

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
          .select('preferred_currency, preferred_platform')
          .eq('id', user.id)
          .single()
        
        if (userProfile?.preferred_currency) {
          setUserCurrency(userProfile.preferred_currency)
        }
        
        // Always set userPlatform to something - either user's preference or default
        const platform = userProfile?.preferred_platform || 'justgiving'
        setUserPlatform(platform)
        setSelectedPlatform(platform)
      } catch (err) {
        // Set default platform even on error
        setUserPlatform('justgiving')
        setSelectedPlatform('justgiving')
      }
    }

    // Legacy fetchServices function - removed (not used)

    loadMessages()
    fetchUserPreferences()
    // Don't fetch services here - do it after userPlatform is loaded
  }, [locale, user])

  // Fetch services when userPlatform is loaded (for authenticated users) or platform changes (for anonymous users)
  useEffect(() => {
    if (user && userPlatform !== null) {
      // For authenticated users, fetch when userPlatform changes (and is loaded)
      setLoading(true)
      const fetchServices = async () => {
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
          // Filter by platform on client side to handle null/undefined platform values
          const filteredByPlatform = servicesData.filter(service => {
            const servicePlatform = service.platform || 'justgiving' // Default to justgiving for legacy services
            return servicePlatform === userPlatform
          })
          setServices(filteredByPlatform)
          setFilteredServices(filteredByPlatform)
        }
        
        setLoading(false)
      }
      
      fetchServices()
    } else if (selectedPlatform) {
      // For anonymous users, fetch when selectedPlatform changes
      setLoading(true)
      const fetchServices = async () => {
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
          // Filter by platform on client side to handle null/undefined platform values
          const filteredByPlatform = servicesData.filter(service => {
            const servicePlatform = service.platform || 'justgiving' // Default to justgiving for legacy services
            return servicePlatform === selectedPlatform
          })
          setServices(filteredByPlatform)
          setFilteredServices(filteredByPlatform)
        }
        
        setLoading(false)
      }
      
      fetchServices()
    }
  }, [user, userPlatform, selectedPlatform])

  // Filter services based on search query and location filter
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
  }, [services, searchQuery, locationFilter])

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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
      <MultilingualNavbar locale={locale} messages={messages} />
      
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {messages.services?.browse?.title || 'Browse Services'}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {messages.services?.browse?.subtitle || 'Find professional services and support charities'}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 space-y-6">
            {/* Platform Filter (for anonymous users only) */}
            {!user && (
              <div>
                <label htmlFor="platform-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Donation Platform
                </label>
                <select
                  id="platform-select"
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value as DonationPlatform)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="justgiving">JustGiving (Available Now)</option>
                  <option value="every_org">Every.org (Coming Soon)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedPlatform === 'every_org' 
                    ? 'Every.org integration is in development. Currently showing no services.'
                    : 'Showing services that support JustGiving charitable donations.'
                  }
                </p>
              </div>
            )}

            {/* Platform Info for authenticated users */}
            {user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">
                      Your Platform: {userPlatform === 'justgiving' ? 'JustGiving' : 'Every.org'}
                    </h4>
                    <p className="text-sm text-blue-700">
                      {userPlatform === 'justgiving' 
                        ? 'Showing services that support JustGiving charitable donations.'
                        : 'Every.org integration coming soon. Switch to JustGiving to see available services.'
                      }
                    </p>
                  </div>
                  <a 
                    href={`/${locale}/dashboard/profile`}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Change Platform
                  </a>
                </div>
              </div>
            )}

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
          {(locationFilter.type !== 'all' || searchQuery.trim()) && (
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
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {service.title}
                      </h3>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          service.platform === 'justgiving' 
                            ? 'bg-blue-100 text-blue-800' 
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
                  
                  <div className="flex items-center justify-between">
                    <ServicePrice
                      pricingTierId={service.pricing_tier_id}
                      userCurrency={userCurrency}
                      className="text-2xl font-bold text-green-600"
                    />
                    <a 
                      href={`/${locale}/services/${generateSlug(service.title)}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm inline-block text-center"
                    >
                      {messages.common?.view || 'View Details'}
                    </a>
                  </div>
                </div>
              </div>
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
                <div className="text-2xl font-bold text-purple-600">
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
    </div>
  )
}