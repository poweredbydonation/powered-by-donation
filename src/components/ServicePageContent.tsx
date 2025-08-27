'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation, CurrencyCode } from '@/types/database'
import { useAuth } from '@/hooks/useAuth'
import ServicePrice from '@/components/services/ServicePrice'
import ServiceCreationForm from '@/components/services/ServiceCreationForm'
import PlatformRequirementsSelector from '@/components/services/PlatformRequirementsSelector'
import { MapPin, Heart, Clock, User, Globe, ArrowLeft, Edit } from 'lucide-react'

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
  const [isEditing, setIsEditing] = useState(false)

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

  // Extract fetchService function so it can be called from edit form
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

    // Find service by slug
    const foundService = services?.find(s => generateSlug(s.title) === slug)
    
    if (foundService) {
      setService(foundService)
    } else {
      setService(null)
    }
    setLoading(false)
  }

  useEffect(() => {
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
  
  // Check if current user owns this service
  const isOwner = user && service && service.user_id === user.id

  // If in edit mode and user owns the service, show edit form
  if (isEditing && isOwner) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="mb-6">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Service
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Edit Service</h1>
            <p className="text-gray-600 mt-2">Update your service details</p>
          </div>
          
          <ServiceCreationForm 
            initialData={service}
            mode="edit"
            onSuccess={() => {
              setIsEditing(false)
              // Refresh service data
              fetchService()
            }}
            onCancel={() => {
              setIsEditing(false)
            }}
          />
        </div>
      </div>
    )
  }

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
              {isOwner ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Service
                </button>
              ) : (
                <button
                  onClick={handleRequestService}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  {messages.services?.request?.button || 'Request Service'}
                </button>
              )}
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

        {/* Comprehensive Service Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
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
              <div>
                <span className="font-medium text-gray-700">Service Created:</span>
                <span className="ml-2 text-gray-600">
                  {service.created_at ? new Date(service.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Service Details
            </h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">Donation Amount:</span>
                <span className="ml-2 text-green-600 font-semibold">
                  <ServicePrice
                    pricingTierId={service.pricing_tier_id}
                    userCurrency={userCurrency}
                  />
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Location:</span>
                <span className="ml-2 text-gray-600">{getLocationDisplay(service.service_locations)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  service.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Directory Visible:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  service.show_in_directory ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {service.show_in_directory ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Availability & Capacity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Availability
            </h3>
            <div className="space-y-3">
              {service.available_from && (
                <div>
                  <span className="font-medium text-gray-700">Available From:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(service.available_from).toLocaleDateString()}
                  </span>
                </div>
              )}
              {service.available_until && (
                <div>
                  <span className="font-medium text-gray-700">Available Until:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(service.available_until).toLocaleDateString()}
                  </span>
                </div>
              )}
              {service.max_donors && (
                <div>
                  <span className="font-medium text-gray-700">Max Donors:</span>
                  <span className="ml-2 text-gray-600">{service.max_donors}</span>
                </div>
              )}
            </div>
          </div>

          {/* Platform Requirements */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {service.platform_requirements ? (
              <PlatformRequirementsSelector
                value={service.platform_requirements}
                onChange={() => {}} // No-op for read-only mode
                locale={locale}
                readOnly={true}
              />
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Platform Requirements
                </h3>
                <div className="text-gray-500 italic">
                  No platform requirements configured
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Service Locations (if multiple) */}
        {service.service_locations && Array.isArray(service.service_locations) && service.service_locations.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Service Locations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.service_locations.map((location: any, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Type:</span>
                      <span className="ml-2 text-gray-600 capitalize">{location.type || 'Remote'}</span>
                    </div>
                    {location.address && (
                      <div>
                        <span className="font-medium text-gray-700">Address:</span>
                        <span className="ml-2 text-gray-600">{location.address}</span>
                      </div>
                    )}
                    {location.area && (
                      <div>
                        <span className="font-medium text-gray-700">Area:</span>
                        <span className="ml-2 text-gray-600">{location.area}</span>
                      </div>
                    )}
                    {location.radius && (
                      <div>
                        <span className="font-medium text-gray-700">Radius:</span>
                        <span className="ml-2 text-gray-600">{location.radius} miles</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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