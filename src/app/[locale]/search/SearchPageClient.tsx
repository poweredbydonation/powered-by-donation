'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import ServiceList from '@/components/services/ServiceList'
import ServiceFilter, { ServiceFilters } from '@/components/services/ServiceFilter'
import ServiceSort, { SortOption, sortServices } from '@/components/services/ServiceSort'
import Link from 'next/link'
import { formatCurrency } from '@/lib/currency'

type ServiceWithProvider = Service & {
  user: {
    name: string
    bio?: string
    location?: string
  } | null
}

function SearchResults({ locale, messages }: { locale: string, messages: any }) {
  const searchParams = useSearchParams()
  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Get search parameters from URL
  const [filters, setFilters] = useState<ServiceFilters>({})
  const [sortOption, setSortOption] = useState<SortOption>('newest')
  const [searchQuery, setSearchQuery] = useState('')

  const supabase = createClient()

  // Initialize filters from URL parameters
  useEffect(() => {
    const urlFilters: ServiceFilters = {}
    const query = searchParams.get('q') || ''
    
    if (searchParams.get('category')) urlFilters.category = searchParams.get('category')!
    if (searchParams.get('location')) urlFilters.location = searchParams.get('location')!
    if (searchParams.get('minAmount')) urlFilters.minAmount = parseInt(searchParams.get('minAmount')!)
    if (searchParams.get('maxAmount')) urlFilters.maxAmount = parseInt(searchParams.get('maxAmount')!)
    if (searchParams.get('minHappiness')) urlFilters.minHappiness = parseInt(searchParams.get('minHappiness')!)
    if (searchParams.get('locationType')) urlFilters.locationType = searchParams.get('locationType') as any
    if (searchParams.get('charityRequirement')) urlFilters.charityRequirement = searchParams.get('charityRequirement') as any
    if (searchParams.get('sort')) setSortOption(searchParams.get('sort') as SortOption)

    setFilters(urlFilters)
    setSearchQuery(query)
  }, [searchParams])

  // Fetch services from database
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true)
        setError(null)

        const { data, error: fetchError } = await supabase
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

        if (fetchError) {
          throw fetchError
        }

        // Filter out services without user data
        const validServices = (data || []).filter(service => service.user !== null)
        setServices(validServices)
      } catch (err) {
        console.error('Error fetching services:', err)
        setError('Failed to load services. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [supabase])

  // Apply search query and filters
  useEffect(() => {
    let filtered = [...services]

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(query) ||
        service.description?.toLowerCase().includes(query) ||
        service.user?.name.toLowerCase().includes(query)
      )
    }

    // Apply filters (same logic as browse page)
    if (filters.category) {
      filtered = filtered.filter(service => 
        service.title.toLowerCase().includes(filters.category!.toLowerCase()) ||
        service.description?.toLowerCase().includes(filters.category!.toLowerCase())
      )
    }

    if (filters.location) {
      filtered = filtered.filter(service => {
        const locations = Array.isArray(service.service_locations) 
          ? service.service_locations as any[]
          : []
        
        return locations.some(location => 
          location.area?.toLowerCase().includes(filters.location!.toLowerCase()) ||
          location.address?.toLowerCase().includes(filters.location!.toLowerCase())
        )
      })
    }

    if (filters.locationType && filters.locationType !== 'all') {
      filtered = filtered.filter(service => {
        const locations = Array.isArray(service.service_locations) 
          ? service.service_locations as any[]
          : []
        
        return locations.some(location => location.type === filters.locationType)
      })
    }

    if (filters.charityRequirement && filters.charityRequirement !== 'all') {
      filtered = filtered.filter(service => 
        service.charity_requirement_type === filters.charityRequirement
      )
    }

    if (filters.minAmount) {
      filtered = filtered.filter(service => service.donation_amount >= filters.minAmount!)
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(service => service.donation_amount <= filters.maxAmount!)
    }

    if (filters.minHappiness) {
      filtered = filtered.filter(service => 
        service.happiness_rate !== null && service.happiness_rate !== undefined && 
        service.happiness_rate >= filters.minHappiness!
      )
    }

    // Apply sorting
    const sorted = sortServices(filtered, sortOption)
    setFilteredServices(sorted)
  }, [services, filters, sortOption, searchQuery])

  // Update URL when filters change
  const updateURL = (newFilters: ServiceFilters, newSort?: SortOption, newQuery?: string) => {
    const params = new URLSearchParams()
    
    if (newQuery || searchQuery) params.set('q', newQuery || searchQuery)
    if (newFilters.category) params.set('category', newFilters.category)
    if (newFilters.location) params.set('location', newFilters.location)
    if (newFilters.minAmount) params.set('minAmount', newFilters.minAmount.toString())
    if (newFilters.maxAmount) params.set('maxAmount', newFilters.maxAmount.toString())
    if (newFilters.minHappiness) params.set('minHappiness', newFilters.minHappiness.toString())
    if (newFilters.locationType && newFilters.locationType !== 'all') params.set('locationType', newFilters.locationType)
    if (newFilters.charityRequirement && newFilters.charityRequirement !== 'all') params.set('charityRequirement', newFilters.charityRequirement)
    if (newSort && newSort !== 'newest') params.set('sort', newSort)

    const newURL = `/${locale}/search${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState({}, '', newURL)
  }

  const handleFiltersChange = (newFilters: ServiceFilters) => {
    setFilters(newFilters)
    updateURL(newFilters, sortOption, searchQuery)
  }

  const handleClearFilters = () => {
    const clearedFilters = {}
    setFilters(clearedFilters)
    setSearchQuery('')
    setSortOption('newest')
    window.history.replaceState({}, '', `/${locale}/search`)
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort)
    updateURL(filters, newSort, searchQuery)
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    updateURL(filters, sortOption, query)
  }

  // Generate search summary
  const getSearchSummary = () => {
    const parts = []
    if (searchQuery) parts.push(`"${searchQuery}"`)
    if (filters.category) parts.push(`in ${filters.category}`)
    if (filters.location) parts.push(`near ${filters.location}`)
    if (filters.minAmount || filters.maxAmount) {
      const min = filters.minAmount ? formatCurrency(filters.minAmount) : 'any'
      const max = filters.maxAmount ? formatCurrency(filters.maxAmount) : 'any'
      parts.push(`${min} - ${max}`)
    }
    
    return parts.length > 0 ? parts.join(' ') : 'all services'
  }

  return (
    <>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Search Header */}
          <div className="mb-8">
            <nav className="text-sm text-gray-500 mb-3">
              <Link href={`/${locale}/browse`} className="hover:text-gray-700">Browse Services</Link>
              <span className="mx-2">›</span>
              <span className="text-gray-900 font-medium">Search Results</span>
            </nav>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Search Results</h1>
            <p className="text-lg text-gray-600">
              Showing results for: <span className="font-medium">{getSearchSummary()}</span>
            </p>
          </div>

          {/* Search Input */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-6">
            <div className="max-w-2xl">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search services, providers, or descriptions
              </label>
              <input
                type="text"
                id="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="e.g. web design, tutoring, logo design..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <ServiceFilter
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          {/* Sort and Results Count */}
          <ServiceSort
            currentSort={sortOption}
            onSortChange={handleSortChange}
            resultsCount={filteredServices.length}
          />

          {/* Services List */}
          <ServiceList
            services={filteredServices}
            loading={loading}
            error={error}
            emptyMessage={`No services match your search criteria. Try adjusting your search terms or filters to find what you're looking for.`}
          />

          {/* Search Tips */}
          {filteredServices.length === 0 && !loading && !error && (
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Tips</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Try broader terms:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use general categories like "design" instead of "logo design"</li>
                      <li>• Search by location like "Sydney" or "Remote"</li>
                      <li>• Try skill-based terms like "tutoring" or "consulting"</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Adjust filters:</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Remove price range restrictions</li>
                      <li>• Try "Any charity" instead of specific charities</li>
                      <li>• Include remote services in your search</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link
                    href={`/${locale}/browse`}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                  >
                    Browse All Services
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Search Statistics */}
          {filteredServices.length > 0 && !loading && !error && (
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Search Results Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{filteredServices.length}</div>
                  <div className="text-sm text-gray-500">Services Found</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(filteredServices.reduce((sum, service) => sum + service.donation_amount, 0))}
                  </div>
                  <div className="text-sm text-gray-500">Total Donation Potential</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(filteredServices.map(s => s.user_id)).size}
                  </div>
                  <div className="text-sm text-gray-500">Unique Providers</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {filteredServices.length > 0 ? formatCurrency(Math.round(filteredServices.reduce((sum, service) => sum + service.donation_amount, 0) / filteredServices.length)) : '$0'}
                  </div>
                  <div className="text-sm text-gray-500">Average Donation</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default function SearchPageClient({ locale, messages }: { locale: string, messages: any }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-32 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <SearchResults locale={locale} messages={messages} />
    </Suspense>
  )
}