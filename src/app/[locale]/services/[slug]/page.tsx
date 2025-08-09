'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation, CurrencyCode, ServiceWithPlatformFields } from '@/types/database'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import ServiceDonationFlow from '@/components/services/ServiceDonationFlow'
import ServiceLocationMap from '@/components/ServiceLocationMap'
import ServicePrice from '@/components/services/ServicePrice'
import PlatformAccessGuard from '@/components/PlatformAccessGuard'
import { useAuth } from '@/hooks/useAuth'

interface ServicePageProps {
  params: {
    slug: string
    locale: string
  }
}

type ServiceWithFundraiser = ServiceWithPlatformFields & {
  user: {
    id: string
    name: string
    bio: string | null
    avatar_url: string | null
    location: string | null
    created_at: string
  }
}

// Generate slug from service title
function generateSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function ServicePage({ params }: ServicePageProps) {
  const { locale, slug } = params
  const { user } = useAuth()
  const [service, setService] = useState<ServiceWithFundraiser | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any>({})
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('AUD')

  useEffect(() => {
    async function loadData() {
      const supabase = createClient()
      
      // Load messages
      try {
        const msgs = (await import(`../../../../messages/${locale}.json`)).default
        setMessages(msgs)
      } catch (error) {
        const msgs = (await import(`../../../../messages/en.json`)).default
        setMessages(msgs)
      }

      // Fetch user's currency
      if (user) {
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
          // Keep default AUD
        }
      }

      // Fetch service
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          user:users (
            id,
            name,
            bio,
            avatar_url,
            location,
            created_at
          )
        `)
        .eq('is_active', true)
        .eq('show_in_directory', true)

      if (error) {
        setService(null)
      } else {
        const foundService = services?.find(s => generateSlug(s.title) === slug)
        setService(foundService || null)
      }
      
      setLoading(false)
    }

    loadData()
  }, [locale, slug, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!service) {
    notFound()
  }

  // Parse service locations
  const locations = Array.isArray(service.service_locations) 
    ? service.service_locations as ServiceLocation[]
    : []

  // Get availability status
  const now = new Date()
  const availableFrom = new Date(service.available_from)
  const availableUntil = service.available_until ? new Date(service.available_until) : null
  
  const isAvailable = now >= availableFrom && (!availableUntil || now <= availableUntil)
  const isFull = Boolean(service.max_donors && service.current_donors && 
    service.current_donors >= service.max_donors)

  const getLocationDisplay = (location: ServiceLocation) => {
    switch (location.type) {
      case 'remote':
        return 'Remote service available worldwide'
      case 'hybrid':
        return `Hybrid service (${location.area || 'flexible location'})`
      case 'physical':
        return location.area ? `In-person service in ${location.area}` : 'Physical service location'
      default:
        return 'Location details available upon booking'
    }
  }

  return (
    <PlatformAccessGuard 
      servicePlatform={service.platform || 'justgiving'} 
      serviceTitle={service.title} 
      locale={locale}
    >
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Service Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                {/* Left Column - Service Info */}
                <div className="flex-1">
                  <div className="mb-6">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      {service.title}
                    </h1>
                    
                    {/* Service status badges */}
                    <div className="flex items-center flex-wrap gap-2 mb-4">
                      {/* Platform badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        service.platform === 'justgiving' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {service.platform === 'justgiving' ? 'JustGiving' : 'Every.org'}
                      </span>
                      
                      {isAvailable && !isFull ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-green-800 bg-green-100">
                          Available Now
                        </span>
                      ) : isFull ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-red-800 bg-red-100">
                          Currently Full
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-yellow-800 bg-yellow-100">
                          Starts {availableFrom.toLocaleDateString()}
                        </span>
                      )}
                      
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-purple-800 bg-purple-100">
                        {service.charity_requirement_type === 'any_charity' ? 'Any Charity' : 'Specific Charities'}
                      </span>
                    </div>

                    {service.description && (
                      <p className="text-lg text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    )}
                  </div>

                  {/* Service Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Location Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Location</h3>
                      <div className="space-y-2">
                        {locations.map((location, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <div className="text-blue-600 mt-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <span className="text-gray-600">{getLocationDisplay(location)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Availability */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Availability</h3>
                      <div className="space-y-2 text-gray-600">
                        <div>Available from: <span className="font-medium">{availableFrom.toLocaleDateString()}</span></div>
                        {availableUntil && (
                          <div>Available until: <span className="font-medium">{availableUntil.toLocaleDateString()}</span></div>
                        )}
                        {service.max_donors && (
                          <div>
                            Capacity: <span className="font-medium">
                              {service.current_donors || 0} / {service.max_donors} donors
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Donation Flow */}
                <div className="lg:w-96">
                  <ServiceDonationFlow
                    service={{
                      id: service.id,
                      title: service.title,
                      donation_amount: service.donation_amount,
                      pricing_tier_id: service.pricing_tier_id,
                      charity_requirement_type: service.charity_requirement_type,
                      preferred_charities: service.preferred_charities ? 
                        (Array.isArray(service.preferred_charities) ? 
                          service.preferred_charities as Array<{
                            charity_id: string
                            name: string
                            description?: string
                            logo_url?: string
                          }> : null) : null,
                      platform: service.platform,
                      organization_id: service.organization_id,
                      organization_name: service.organization_name,
                      fundraiser: {
                        id: service.user.id,
                        name: service.user.name
                      }
                    }}
                    userCurrency={userCurrency}
                    isAvailable={isAvailable}
                    isFull={isFull}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Service Location Map */}
          {locations.some(loc => (loc.type === 'physical' || loc.type === 'hybrid') && loc.latitude && loc.longitude) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Service Location</h2>
                <ServiceLocationMap 
                  locations={locations}
                />
              </div>
            </div>
          )}

          {/* Fundraiser Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">About the Fundraiser</h2>
              <div className="flex items-start space-x-6">
                {service.user.avatar_url && (
                  <img 
                    src={service.user.avatar_url} 
                    alt={service.user.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {service.user.name}
                  </h3>
                  {service.user.bio && (
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {service.user.bio}
                    </p>
                  )}
                  <div className="text-sm text-gray-500">
                    Fundraiser since {new Date(service.user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Anonymous Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-gray-500">
                  Anonymous donation activity will appear here once donors begin using this service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PlatformAccessGuard>
  )
}