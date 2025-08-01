'use client'

import { useState, useEffect } from 'react'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import { Search, MapPin, Heart, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation } from '@/types/database'

interface BrowsePageProps {
  params: {
    locale: string
  }
}

type ServiceWithProvider = Service & {
  users: {
    id: string
    name: string
  }
}

export default function BrowsePage({ params }: BrowsePageProps) {
  const locale = params.locale
  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any>({})

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

    // Fetch services
    async function fetchServices() {
      const supabase = createClient()
      
      console.log('🔍 Starting to fetch services...')
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          users (
            id,
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching services:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        setServices([])
      } else {
        console.log('✅ Fetched services successfully:', data)
        console.log('📊 Number of services:', data?.length || 0)
        if (data && data.length > 0) {
          console.log('🔍 First service sample:', data[0])
        }
        setServices(data || [])
      }
      
      setLoading(false)
    }

    loadMessages()
    fetchServices()
  }, [locale])

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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={messages.common?.search || 'Search services...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                  <option>{messages.services?.browse?.allLocations || 'All Locations'}</option>
                  <option>Sydney, NSW</option>
                  <option>Melbourne, VIC</option>
                  <option>Brisbane, QLD</option>
                </select>
              </div>

              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {messages.common?.search || 'Search'}
              </button>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading services...</p>
              </div>
            ) : services.length === 0 ? (
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services available</h3>
                <p className="text-gray-500">
                  Be the first to create a service and help charities!
                </p>
              </div>
            ) : (
              services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {service.title}
                    </h3>
                    {/* Remove rating for now since we don't have happiness ratings yet */}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description || 'No description provided'}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">{messages.services?.browse?.provider || 'Provider'}:</span>
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
                    <div className="text-2xl font-bold text-green-600">
                      ${service.donation_amount}
                    </div>
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
                <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.activeServices || 'Active Services'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${services.reduce((total, service) => total + service.donation_amount, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.totalDonationPotential || 'Total Donation Potential'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(services.map(service => service.users.id)).size}
                </div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.activeProviders || 'Active Providers'}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              {messages.services?.browse?.communityImpact?.donationsNote || 'All donations go directly to registered charities via JustGiving'}
            </p>
          </div>

          {/* Call to Action for Providers */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {messages.services?.browse?.callToAction?.title || 'Want to offer your services?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {messages.services?.browse?.callToAction?.description || 'Join our community of providers and help charities while showcasing your skills.'}
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