'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation, CurrencyCode } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import ServicePrice from '@/components/services/ServicePrice'
import { MapPin, Heart, Clock, User, Globe, ArrowLeft } from 'lucide-react'

interface ServicePageProps {
  params: {
    locale: string
    slug: string
  }
}

type ServiceWithFundraiser = Service & {
  users: {
    id: string
    name: string
    bio?: string
  }
}

export default function ServicePageContent({ params }: ServicePageProps) {
  const { locale, slug } = params
  const { user } = useAuth()
  const [service, setService] = useState<ServiceWithFundraiser | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any>({})
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('AUD')

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

  useEffect(() => {
    const fetchService = async () => {
      setLoading(true)
      const supabase = createClient()
      
      // Generate slug from title for comparison
      const generateSlug = (title: string): string => {
        return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      }

      // First, get all services and find by slug
      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          users (
            id,
            name,
            bio
          )
        `)
        .eq('is_active', true)
        .eq('show_in_directory', true)

      if (error) {
        console.error('Error fetching services:', error)
        setService(null)
        setLoading(false)
        return
      }

      // Find service by matching slug
      const matchedService = services?.find(s => generateSlug(s.title) === slug)
      
      if (!matchedService) {
        setService(null)
        setLoading(false)
        return
      }

      setService(matchedService)
      setLoading(false)
    }
    
    fetchService()
  }, [slug])

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

  const handleRequestService = async () => {
    if (!service || !user) {
      // Redirect to login if not authenticated
      const servicesSlug = locale === 'tr' ? 'hizmetler' : 'services'
      window.location.href = `/${locale}/system/login?redirect=/${locale}/PoweredByDonation/${servicesSlug}/${slug}`
      return
    }

    try {
      const response = await fetch('/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: service.id,
          donation_amount: service.donation_amount,
          platform: service.platform
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create service request')
      }

      // Show success message and redirect to workflow dashboard
      alert('Service request sent successfully! You will be notified when the fundraiser responds.')
      window.location.href = `/${locale}/my/services`

    } catch (error) {
      console.error('Error creating service request:', error)
      alert(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    }
  }

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

  const servicesSlug = locale === 'tr' ? 'hizmetler' : 'services'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <a href={`/${locale}`} className="hover:text-blue-600">Home</a>
            <span>/</span>
            <a href={`/${locale}/PoweredByDonation/${servicesSlug}`} className="hover:text-blue-600">Services</a>
            <span>/</span>
            <span className="text-gray-900">{service.title}</span>
          </nav>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{service.title}</h1>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  service.platform === 'justgiving' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {service.platform === 'justgiving' ? 'JustGiving' : 'Every.org'}
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <span>{service.users.name}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{getLocationDisplay(service.service_locations)}</span>
                </div>
                <div className="flex items-center">
                  <Heart className="h-4 w-4 mr-1" />
                  <span>{service.charity_requirement_type === 'any_charity' ? 'Any Charity' : 'Specific Charities'}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="mb-2">
                <ServicePrice
                  pricingTierId={service.pricing_tier_id}
                  userCurrency={userCurrency}
                  className="text-3xl font-bold text-blue-600"
                />
              </div>
              <button
                onClick={handleRequestService}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                {messages.services?.request?.button || 'Request Service'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {messages.services?.detail?.description || 'Service Description'}
          </h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {service.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Service Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Fundraiser Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {messages.services?.detail?.fundraiser || 'About the Fundraiser'}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-gray-600">{service.users.name}</span>
              </div>
              {service.users.bio && (
                <div>
                  <span className="font-medium text-gray-700">Bio:</span>
                  <p className="mt-1 text-gray-600">{service.users.bio}</p>
                </div>
              )}
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {messages.services?.detail?.details || 'Service Details'}
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Platform:</span>
                <span className="ml-2 text-gray-600">
                  {service.platform === 'justgiving' ? 'JustGiving' : 'Every.org'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="ml-2 text-gray-600">{getLocationDisplay(service.service_locations)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Charity Requirements:</span>
                <span className="ml-2 text-gray-600">
                  {service.charity_requirement_type === 'any_charity' ? 'Any registered charity' : 'Specific charities only'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Price:</span>
                <span className="ml-2 text-gray-600">
                  <ServicePrice
                    pricingTierId={service.pricing_tier_id}
                    userCurrency={userCurrency}
                    className="font-semibold"
                  />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-blue-50 rounded-lg p-6 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {messages.services?.detail?.ready || 'Ready to get started?'}
          </h3>
          <p className="text-gray-600 mb-4">
            {messages.services?.detail?.readyDescription || 'Request this service and make a donation to support a charity of your choice.'}
          </p>
          <button
            onClick={handleRequestService}
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            {messages.services?.request?.button || 'Request Service'}
          </button>
        </div>

        {/* Back to Services */}
        <div className="mt-8">
          <a
            href={`/${locale}/PoweredByDonation/${servicesSlug}`}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {messages.services?.detail?.backToServices || 'Back to Services'}
          </a>
        </div>
      </div>
    </div>
  )
}