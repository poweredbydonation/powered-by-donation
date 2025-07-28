'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { Service, ServiceLocation } from '@/types/database'

type UserService = Service & {
  provider: {
    name: string
  }
}

export default function ServicesPage() {
  const [services, setServices] = useState<UserService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    async function fetchUserServices() {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
          .from('services')
          .select(`
            *,
            provider:providers (
              name
            )
          `)
          .eq('provider_id', user.id)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setServices(data || [])
      } catch (err) {
        console.error('Error fetching user services:', err)
        setError('Failed to load your services. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserServices()
  }, [user, supabase])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

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

  const getAvailabilityStatus = (service: Service) => {
    const now = new Date()
    const availableFrom = new Date(service.available_from)
    const availableUntil = service.available_until ? new Date(service.available_until) : null
    
    if (now < availableFrom) {
      return { status: 'upcoming', text: `Starts ${availableFrom.toLocaleDateString()}`, color: 'text-yellow-600' }
    }
    
    if (availableUntil && now > availableUntil) {
      return { status: 'expired', text: 'Expired', color: 'text-red-600' }
    }
    
    if (service.max_supporters && service.current_supporters && service.current_supporters >= service.max_supporters) {
      return { status: 'full', text: 'Full', color: 'text-red-600' }
    }
    
    return { status: 'active', text: 'Active', color: 'text-green-600' }
  }

  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
                <p className="mt-2 text-gray-600">
                  Manage your service offerings and track supporter engagement
                </p>
              </div>
              <Link
                href="/dashboard/services/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Create New Service
              </Link>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="text-red-800">
                <h3 className="font-medium mb-2">Error loading services</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && services.length === 0 && (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 text-center">
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
                <p className="text-gray-500 mb-4">
                  Create your first service to start connecting with supporters and helping charities.
                </p>
                <Link
                  href="/dashboard/services/create"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  Create Your First Service
                </Link>
              </div>
            </div>
          )}

          {/* Services List */}
          {!loading && !error && services.length > 0 && (
            <div className="space-y-6">
              {services.map((service) => {
                const availability = getAvailabilityStatus(service)
                
                return (
                  <div key={service.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">
                              {service.title}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${availability.color} bg-opacity-10`}>
                              {availability.text}
                            </span>
                            {!service.is_active && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-gray-600 bg-gray-100">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          {service.description && (
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {service.description}
                            </p>
                          )}

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Donation:</span>
                              <div className="font-semibold text-green-600">
                                {formatCurrency(service.donation_amount)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Location:</span>
                              <div className="font-medium">
                                {getLocationDisplay(service.service_locations)}
                              </div>
                            </div>
                            
                            <div>
                              <span className="text-gray-500">Charity:</span>
                              <div className="font-medium">
                                {service.charity_requirement_type === 'any_charity' ? 'Any charity' : 'Specific charities'}
                              </div>
                            </div>
                            
                            {service.max_supporters && (
                              <div>
                                <span className="text-gray-500">Capacity:</span>
                                <div className="font-medium">
                                  {service.current_supporters || 0} / {service.max_supporters}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 text-sm font-medium">
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  )
}