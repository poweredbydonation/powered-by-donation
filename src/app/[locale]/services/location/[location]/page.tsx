import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Service, ServiceLocation } from '@/types/database'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import ServiceList from '@/components/services/ServiceList'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'
import { getMessages } from 'next-intl/server'

interface LocationPageProps {
  params: {
    location: string
    locale: string
  }
}

type ServiceWithProvider = Service & {
  user: {
    name: string
    bio?: string
    location?: string
  } | null
}

// Common Australian locations and service areas
const COMMON_LOCATIONS = [
  'Sydney',
  'Melbourne', 
  'Brisbane',
  'Perth',
  'Adelaide',
  'Gold Coast',
  'Newcastle',
  'Canberra',
  'Central Coast',
  'Sunshine Coast',
  'Geelong',
  'Hobart',
  'Townsville',
  'Cairns',
  'Toowoomba',
  'Ballarat',
  'Bendigo',
  'Albury',
  'Launceston',
  'Mackay',
  'Rockhampton',
  'Bunbury',
  'Bundaberg',
  'Wagga Wagga',
  'Hervey Bay',
  'Mildura',
  'Shepparton',
  'Port Macquarie',
  'Gladstone',
  'Tamworth',
  'Remote', // For remote services
  'Online', // For online services
  'Australia Wide' // For nationwide services
]

// Format location for display (decode URL and capitalize)  
function formatLocationName(location: string): string {
  return decodeURIComponent(location)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Format location for URL (encode and lowercase with hyphens)
function formatLocationSlug(location: string): string {
  return location.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function getServicesByLocation(location: string): Promise<ServiceWithProvider[]> {
  const supabase = createClient()
  const formattedLocation = formatLocationName(location)

  const { data: services, error } = await supabase
    .from('services')
    .select(`
      *,
      user:users (
        name,
        bio,
        location
      )
    `)
    .eq('is_active', true)
    .eq('show_in_directory', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  // Filter services by location (search in service_locations)
  return (services || []).filter(service => {
    if (!service.user) return false
    
    const locations = Array.isArray(service.service_locations) 
      ? service.service_locations as ServiceLocation[]
      : []
    
    // Check if location matches any service location
    return locations.some(loc => {
      // Handle remote/online services
      if (formattedLocation.toLowerCase() === 'remote' || formattedLocation.toLowerCase() === 'online') {
        return loc.type === 'remote'
      }
      
      // Handle Australia Wide services
      if (formattedLocation.toLowerCase() === 'australia wide') {
        return loc.type === 'remote' || (loc.area && loc.area.toLowerCase().includes('australia'))
      }
      
      // Check area and address for location match
      return (loc.area && loc.area.toLowerCase().includes(formattedLocation.toLowerCase())) ||
             (loc.address && loc.address.toLowerCase().includes(formattedLocation.toLowerCase()))
    })
  })
}

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const locationName = formatLocationName(params.location)
  const services = await getServicesByLocation(params.location)

  const totalDonationPotential = services.reduce((sum, service) => sum + service.donation_amount, 0)
  const formattedAmount = formatCurrency(totalDonationPotential)

  const isRemoteLocation = ['remote', 'online', 'australia wide'].includes(locationName.toLowerCase())
  const locationDescription = isRemoteLocation 
    ? `${locationName.toLowerCase()} services available anywhere`
    : `services available in ${locationName}`

  return {
    title: `${locationName} Services | Powered by Donation`,
    description: `Discover ${services.length} ${locationDescription} where providers offer their skills in exchange for charitable donations. Total donation potential: ${formattedAmount}`,
    openGraph: {
      title: `${locationName} Services - ${services.length} Available`,
      description: `Support local providers in ${locationName} while helping charities. ${services.length} services available with ${formattedAmount} donation potential.`,
      type: 'website',
    },
    keywords: `${locationName.toLowerCase()}, local services, charity, donations, JustGiving, ${locationName.toLowerCase()} providers, community support`
  }
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { locale, location } = params
  const messages = await getMessages({ locale })
  const locationName = formatLocationName(location)
  const services = await getServicesByLocation(location)

  // Calculate location statistics
  const totalDonationPotential = services.reduce((sum, service) => sum + service.donation_amount, 0)
  const activeProviders = new Set(services.map(s => s.user_id)).size
  const averageDonation = services.length > 0 ? Math.round(totalDonationPotential / services.length) : 0

  // Get service types breakdown
  const serviceTypes = services.reduce((acc, service) => {
    const locations = Array.isArray(service.service_locations) 
      ? service.service_locations as ServiceLocation[]
      : []
    
    locations.forEach(loc => {
      const type = loc.type === 'remote' ? 'Remote' : loc.type === 'hybrid' ? 'Hybrid' : 'In-Person'
      acc[type] = (acc[type] || 0) + 1
    })
    
    return acc
  }, {} as Record<string, number>)

  // Sort services by newest first (server-side sorting)
  const sortedServices = [...services].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return dateB - dateA
  })

  const isRemoteLocation = ['remote', 'online', 'australia wide'].includes(locationName.toLowerCase())

  return (
    <>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Location Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <nav className="text-sm text-gray-500 mb-3">
                    <Link href="/browse" className="hover:text-gray-700">Browse Services</Link>
                    <span className="mx-2">›</span>
                    <span className="text-gray-900 font-medium">{locationName}</span>
                  </nav>
                  
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {locationName} Services
                  </h1>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    {isRemoteLocation ? (
                      `Discover ${locationName.toLowerCase()} services available anywhere in Australia. 
                       Connect with skilled providers offering their expertise in exchange for charitable donations.`
                    ) : (
                      `Find local services in ${locationName} where skilled providers offer their expertise 
                       in exchange for charitable donations. Support your community while helping charities.`
                    )}
                  </p>
                </div>

                {/* Location Stats */}
                <div className="lg:w-80">
                  <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      {locationName} Overview
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                        <div className="text-sm text-gray-600">Available Services</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalDonationPotential)}
                        </div>
                        <div className="text-sm text-gray-600">Total Donation Potential</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{activeProviders}</div>
                        <div className="text-sm text-gray-600">Active Providers</div>
                      </div>
                      {averageDonation > 0 && (
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(averageDonation)}
                          </div>
                          <div className="text-sm text-gray-600">Average Donation</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Types Breakdown */}
              {Object.keys(serviceTypes).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Delivery Types</h3>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(serviceTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm text-gray-600">
                          {type}: <span className="font-medium">{count} services</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Services Results */}
          {services.length > 0 ? (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-sm text-gray-600">
                  {services.length === 1 ? (
                    '1 service found'
                  ) : (
                    `${services.length} services found`
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Sorted by newest first
                </div>
              </div>

              {/* Services List */}
              <ServiceList
                services={sortedServices}
                loading={false}
                error={null}
                emptyMessage={`No services are currently available in ${locationName}. Check back soon for new opportunities!`}
              />
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-6">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  No Services in {locationName} Yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  We don't have any services available in {locationName} right now, 
                  but new providers join regularly. You might find what you're looking for in nearby areas or remote services!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/services/location/remote"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    Browse Remote Services
                  </Link>
                  <Link
                    href="/browse"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Browse All Services
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Nearby Locations */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Other Locations</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {COMMON_LOCATIONS
                  .filter(loc => loc.toLowerCase() !== locationName.toLowerCase())
                  .slice(0, 12)
                  .map((location) => (
                    <Link
                      key={location}
                      href={`/services/location/${formatLocationSlug(location)}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{location}</div>
                    </Link>
                  ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/browse"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all locations →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}