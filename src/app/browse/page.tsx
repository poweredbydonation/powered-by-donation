'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Service } from '@/types/database'
import ServiceList from '@/components/services/ServiceList'
import ServiceFilter, { ServiceFilters } from '@/components/services/ServiceFilter'
import ServiceSort, { SortOption, sortServices } from '@/components/services/ServiceSort'
import Navbar from '@/components/Navbar'
import { formatCurrency } from '@/lib/currency'

type ServiceWithProvider = Service & {
  provider: {
    name: string
    show_bio: boolean
  }
}

export default function BrowsePage() {
  const [services, setServices] = useState<ServiceWithProvider[]>([])
  const [filteredServices, setFilteredServices] = useState<ServiceWithProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filter and sort state
  const [filters, setFilters] = useState<ServiceFilters>({})
  const [sortOption, setSortOption] = useState<SortOption>('newest')

  const supabase = createClient()

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
            provider:providers (
              name,
              show_bio
            )
          `)
          .eq('is_active', true)
          .eq('show_in_directory', true)
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setServices(data || [])
      } catch (err) {
        console.error('Error fetching services:', err)
        setError('Failed to load services. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    // Add a small delay to prevent hydration mismatch
    const timeoutId = setTimeout(fetchServices, 100)
    return () => clearTimeout(timeoutId)
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...services]

    // Apply filters
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
  }, [services, filters, sortOption])

  const handleFiltersChange = (newFilters: ServiceFilters) => {
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    setFilters({})
  }

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort)
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Services</h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Discover services where providers offer their skills in exchange for charitable donations. 
              Support causes you care about while getting help with your projects.
            </p>
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
            emptyMessage="No services match your current filters. Try adjusting your search criteria or check back later for new services."
          />

          {/* Anonymous Statistics */}
          {!loading && !error && services.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Community Impact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                  <div className="text-sm text-gray-500">Active Services</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(services.reduce((sum, service) => sum + service.donation_amount, 0))}
                  </div>
                  <div className="text-sm text-gray-500">Total Donation Potential</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Set(services.map(s => s.provider_id)).size}
                  </div>
                  <div className="text-sm text-gray-500">Active Providers</div>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                All donations go directly to registered charities via JustGiving
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}