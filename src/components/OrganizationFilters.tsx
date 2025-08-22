/**
 * Organization Filters Component
 * Sidebar filters for organization browse pages
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DonationPlatform } from '@/types/database'
import { EntityType } from '@/lib/utils/entity-urls'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

interface OrganizationFiltersProps {
  platform: DonationPlatform
  entityType: EntityType
  currentFilters: {
    category?: string
    city?: string
    featured?: boolean
    preferred?: boolean
    purpose?: string
  }
}

interface FilterOptions {
  categories: string[]
  cities: string[]
  purposes: string[]
}

export default function OrganizationFilters({
  platform,
  entityType,
  currentFilters
}: OrganizationFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [options, setOptions] = useState<FilterOptions>({ categories: [], cities: [], purposes: [] })
  const [loading, setLoading] = useState(true)
  const [showAllCities, setShowAllCities] = useState(false)

  // Load filter options
  useEffect(() => {
    async function loadFilterOptions() {
      const supabase = createClient()
      
      try {
        // Get unique categories for this platform
        const { data: organizations } = await supabase
          .from('organization_cache')
          .select('category, acnc_purposes')
          .eq('platform', platform)
          .eq('is_active', true)
          .not('category', 'is', null)

        // Get cities from lookup table for better performance and completeness
        const { data: cityData, error: cityError } = await supabase
          .from(`${platform}_cities_lookup`)
          .select('city')
          .order('organization_count', { ascending: false })
        

        if (organizations && cityData) {
          const categories = Array.from(new Set(organizations.map(o => o.category).filter(Boolean))).sort()
          const cities = cityData.map(item => item.city).filter(Boolean)
          
          // Extract ACNC purposes for ACNC platform
          let purposes: string[] = []
          if (platform === 'acnc') {
            const purposeSet = new Set<string>()
            organizations.forEach(org => {
              if (org.acnc_purposes && typeof org.acnc_purposes === 'object') {
                Object.entries(org.acnc_purposes).forEach(([purpose, value]) => {
                  if (value === true || value === 'true') {
                    purposeSet.add(purpose)
                  }
                })
              }
            })
            purposes = Array.from(purposeSet).sort()
          }
          
          setOptions({ categories, cities, purposes })
        }
      } catch (error) {
        console.error('Error loading filter options:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFilterOptions()
  }, [platform])

  // Update URL with new filters
  const updateFilter = (key: string, value: string | boolean | null) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value === null || value === '' || value === false) {
      params.delete(key)
    } else {
      params.set(key, String(value))
    }
    
    // Reset to page 1 when filters change
    params.delete('page')
    
    router.push(`?${params.toString()}`)
  }

  // Clear all filters
  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('category')
    params.delete('city') 
    params.delete('featured')
    params.delete('preferred')
    params.delete('purpose')
    params.delete('page')
    
    router.push(`?${params.toString()}`)
  }

  // Check if any filters are active
  const hasActiveFilters = Object.values(currentFilters).some(v => v && v !== '')

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-3 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </button>
        )}
      </div>

      {/* Special Filters */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">Show</h4>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={currentFilters.featured || false}
            onChange={(e) => updateFilter('featured', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">Featured only</span>
        </label>
        
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={currentFilters.preferred || false}
            onChange={(e) => updateFilter('preferred', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-600">Preferred by services</span>
        </label>
      </div>

      {/* Category Filter */}
      {options.categories.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Category</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {options.categories.map((category) => (
              <label key={category} className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={category}
                  checked={currentFilters.category === category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{category}</span>
              </label>
            ))}
          </div>
          {currentFilters.category && (
            <button
              onClick={() => updateFilter('category', null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear category
            </button>
          )}
        </div>
      )}

      {/* Location Filter */}
      {options.cities.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Location</h4>
            {options.cities.length > 20 && (
              <button
                onClick={() => setShowAllCities(!showAllCities)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showAllCities ? 'Show less' : `Show all (${options.cities.length})`}
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(showAllCities ? options.cities : options.cities.slice(0, 20)).map((city) => (
              <label key={city} className="flex items-center">
                <input
                  type="radio"
                  name="city"
                  value={city}
                  checked={currentFilters.city === city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  className="rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">{city}</span>
              </label>
            ))}
          </div>
          {currentFilters.city && (
            <button
              onClick={() => updateFilter('city', null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear location
            </button>
          )}
        </div>
      )}

      {/* ACNC Purposes Filter - only for ACNC platform */}
      {platform === 'acnc' && options.purposes.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Charitable Purpose</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {options.purposes.map((purpose) => (
              <label key={purpose} className="flex items-center">
                <input
                  type="radio"
                  name="purpose"
                  value={purpose}
                  checked={currentFilters.purpose === purpose}
                  onChange={(e) => updateFilter('purpose', e.target.value)}
                  className="rounded-full border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </label>
            ))}
          </div>
          {currentFilters.purpose && (
            <button
              onClick={() => updateFilter('purpose', null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear purpose
            </button>
          )}
        </div>
      )}
    </div>
  )
}