/**
 * Organization Browse Component
 * Unified browse experience for both JustGiving charities and Every.org nonprofits
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { EntityType } from '@/lib/utils/entity-urls'
import OrganizationCard from '@/components/OrganizationCard'
import OrganizationFilters from '@/components/OrganizationFilters'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import { getEveryOrgClient } from '@/lib/everyorg/client'
import { Search, Filter } from 'lucide-react'

interface OrganizationBrowseProps {
  locale: string
  platform: DonationPlatform
  entityType: EntityType
  messages?: any
  searchParams: {
    page?: string
    search?: string
    category?: string
    city?: string
    state?: string
    featured?: string
    preferred?: string
    purpose?: string
  }
}

interface BrowseState {
  organizations: OrganizationCache[]
  loading: boolean
  totalCount: number
  hasMore: boolean
  error: string | null
}

const ITEMS_PER_PAGE = 24

export default function OrganizationBrowse({
  locale,
  platform,
  entityType,
  messages,
  searchParams
}: OrganizationBrowseProps) {
  const [state, setState] = useState<BrowseState>({
    organizations: [],
    loading: true,
    totalCount: 0,
    hasMore: false,
    error: null
  })

  const [showFilters, setShowFilters] = useState(false)

  // Parse search params
  const currentPage = parseInt(searchParams.page || '1', 10)
  const searchQuery = searchParams.search || ''
  const categoryFilter = searchParams.category || ''
  const cityFilter = searchParams.city || ''
  const stateFilter = searchParams.state || ''
  const featuredOnly = searchParams.featured === 'true'
  const preferredOnly = searchParams.preferred === 'true'
  const purposeFilter = searchParams.purpose || ''

  // Platform configuration
  const platformConfig = {
    justgiving: {
      name: 'JustGiving',
      entityName: 'Charities',
      color: 'blue'
    },
    everyorg: {
      name: 'Every.org',
      entityName: 'Nonprofits', 
      color: 'green'
    },
    acnc: {
      name: 'ACNC',
      entityName: 'Charities',
      color: 'orange'
    }
  }

  const config = platformConfig[platform]

  // Every.org category system
  const [everyOrgCategories, setEveryOrgCategories] = useState<string[]>([])
  const [dynamicCategories, setDynamicCategories] = useState<string[]>([])
  
  // ACNC purposes system
  const [acncPurposes, setAcncPurposes] = useState<string[]>([])
  const [acncCategories, setAcncCategories] = useState<string[]>([])
  const [acncCities, setAcncCities] = useState<string[]>([])
  
  // Location filter state
  const [locationSearch, setLocationSearch] = useState('')
  const [showAllLocations, setShowAllLocations] = useState(false)
  
  // ACNC state system
  const [acncStates, setAcncStates] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>(stateFilter)
  const [stateCities, setStateCities] = useState<string[]>([])
  
  // Initialize Every.org categories
  useEffect(() => {
    if (platform === 'everyorg') {
      try {
        const client = getEveryOrgClient()
        const popularCategories = client.getPopularCauses()
        setEveryOrgCategories(popularCategories)
        
        // Check if current category filter is not in popular categories and add it to dynamic
        if (categoryFilter && !popularCategories.includes(categoryFilter)) {
          setDynamicCategories(prev => 
            prev.includes(categoryFilter) ? prev : [...prev, categoryFilter]
          )
        }
      } catch (error) {
        console.error('Failed to initialize Every.org client:', error)
      }
    }
  }, [platform, categoryFilter])

  // Initialize ACNC data (purposes, categories, cities)
  useEffect(() => {
    if (platform === 'acnc') {
      const loadAcncData = async () => {
        try {
          const supabase = createClient()
          
          console.log('Loading ACNC filter data...')
          
          // Get all organizations without limit for comprehensive filter data
          const { data: organizations, error } = await supabase
            .from('organization_cache')
            .select('acnc_purposes, category, address_city, acnc_operates_in_act, acnc_operates_in_nsw, acnc_operates_in_nt, acnc_operates_in_qld, acnc_operates_in_sa, acnc_operates_in_tas, acnc_operates_in_vic, acnc_operates_in_wa')
            .eq('platform', 'acnc')
            .eq('is_active', true)
            // Remove limit to get complete filter data

          if (error) {
            console.error('Error loading ACNC data:', error)
            return
          }

          console.log('ACNC organizations loaded for filters:', organizations?.length)

          if (organizations && organizations.length > 0) {
            // Extract purposes
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
            const purposes = Array.from(purposeSet).sort()
            console.log('ACNC purposes found:', purposes.length, purposes.slice(0, 5))
            setAcncPurposes(purposes)

            // Extract categories from ALL organizations
            const categories = Array.from(new Set(organizations.map(o => o.category).filter(Boolean))).sort()
            console.log('ACNC categories found (all organizations):', categories.length, categories)
            setAcncCategories(categories)

            // Extract all cities from ALL organizations
            const allCities = Array.from(new Set(organizations.map(o => o.address_city).filter(Boolean))).sort()
            console.log('ACNC cities found (all organizations):', allCities.length, allCities.slice(0, 10))
            setAcncCities(allCities)

            // Extract states from operates_in fields
            const stateSet = new Set<string>()
            organizations.forEach(org => {
              if (org.acnc_operates_in_act === 'Y') stateSet.add('ACT')
              if (org.acnc_operates_in_nsw === 'Y') stateSet.add('NSW')
              if (org.acnc_operates_in_nt === 'Y') stateSet.add('NT')
              if (org.acnc_operates_in_qld === 'Y') stateSet.add('QLD')
              if (org.acnc_operates_in_sa === 'Y') stateSet.add('SA')
              if (org.acnc_operates_in_tas === 'Y') stateSet.add('TAS')
              if (org.acnc_operates_in_vic === 'Y') stateSet.add('VIC')
              if (org.acnc_operates_in_wa === 'Y') stateSet.add('WA')
            })
            const states = Array.from(stateSet).sort()
            console.log('ACNC states found:', states.length, states)
            setAcncStates(states)
          } else {
            console.log('No ACNC organizations found for filtering')
          }
        } catch (error) {
          console.error('Failed to load ACNC data:', error)
        }
      }
      
      loadAcncData()
    }
  }, [platform])

  // Load cities for selected state
  useEffect(() => {
    if (platform === 'acnc' && stateFilter && stateFilter !== 'all') {
      const loadStateCities = async () => {
        try {
          const supabase = createClient()
          
          console.log('Loading cities for state:', stateFilter)
          
          // Build query to get organizations in the selected state
          let query = supabase
            .from('organization_cache')
            .select('address_city')
            .eq('platform', 'acnc')
            .eq('is_active', true)
            .not('address_city', 'is', null)
          
          // Add state filter based on operates_in fields
          switch (stateFilter) {
            case 'ACT':
              query = query.eq('acnc_operates_in_act', 'Y')
              break
            case 'NSW':
              query = query.eq('acnc_operates_in_nsw', 'Y')
              break
            case 'NT':
              query = query.eq('acnc_operates_in_nt', 'Y')
              break
            case 'QLD':
              query = query.eq('acnc_operates_in_qld', 'Y')
              break
            case 'SA':
              query = query.eq('acnc_operates_in_sa', 'Y')
              break
            case 'TAS':
              query = query.eq('acnc_operates_in_tas', 'Y')
              break
            case 'VIC':
              query = query.eq('acnc_operates_in_vic', 'Y')
              break
            case 'WA':
              query = query.eq('acnc_operates_in_wa', 'Y')
              break
          }

          const { data: organizations, error } = await query

          if (error) {
            console.error('Error loading state cities:', error)
            return
          }

          if (organizations && organizations.length > 0) {
            const cities = Array.from(new Set(organizations.map(o => o.address_city).filter(Boolean))).sort()
            console.log(`Cities found for ${stateFilter}:`, cities.length, cities.slice(0, 5))
            setStateCities(cities)
          } else {
            console.log(`No cities found for ${stateFilter}`)
            setStateCities([])
          }
        } catch (error) {
          console.error('Failed to load state cities:', error)
          setStateCities([])
        }
      }
      
      loadStateCities()
    } else {
      // No state selected, clear state cities
      setStateCities([])
    }
  }, [platform, stateFilter])

  // Format category name for display
  const formatCategoryName = (category: string) => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    const url = new URL(window.location.href)
    if (category === categoryFilter) {
      url.searchParams.delete('category')
    } else {
      url.searchParams.set('category', category)
      
      // Add category to dynamic categories if it's not already in default categories and not already added
      if (platform === 'everyorg' && 
          !everyOrgCategories.includes(category) && 
          !dynamicCategories.includes(category)) {
        setDynamicCategories(prev => [...prev, category])
      }
    }
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  // Handle ACNC purpose selection
  const handlePurposeSelect = (purpose: string) => {
    const url = new URL(window.location.href)
    if (purpose === purposeFilter) {
      url.searchParams.delete('purpose')
    } else {
      url.searchParams.set('purpose', purpose)
    }
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  // Handle ACNC state selection
  const handleStateSelect = (state: string) => {
    const url = new URL(window.location.href)
    if (state === selectedState) {
      url.searchParams.delete('state')
      setSelectedState('')
    } else {
      url.searchParams.set('state', state)
      setSelectedState(state)
    }
    // Clear city filter when state changes
    url.searchParams.delete('city')
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  // Handle ACNC city selection
  const handleCitySelect = (city: string) => {
    const url = new URL(window.location.href)
    if (city === cityFilter) {
      url.searchParams.delete('city')
    } else {
      url.searchParams.set('city', city)
    }
    url.searchParams.delete('page')
    
    // Clear location search when a city is selected to show all cities again
    setLocationSearch('')
    
    window.location.href = url.toString()
  }

  // Combined categories for Every.org
  const allCategories = platform === 'everyorg' 
    ? [...everyOrgCategories, ...dynamicCategories]
    : []

  // Filtered cities for ACNC location search
  const filteredCities = useMemo(() => {
    if (platform !== 'acnc') return []
    
    // Use state-specific cities if a state is selected, otherwise use all cities
    let cities = (stateFilter && stateFilter !== 'all') ? stateCities : acncCities
    
    // Apply search filter
    if (locationSearch.trim()) {
      cities = cities.filter(city => 
        city.toLowerCase().includes(locationSearch.toLowerCase().trim())
      )
      
      // Always include the currently selected city in search results, even if it doesn't match
      if (cityFilter && !cities.includes(cityFilter)) {
        cities = [cityFilter, ...cities]
      }
    } else {
      // Apply show more/less limit only when not searching
      if (!showAllLocations && cities.length > 20) {
        cities = cities.slice(0, 20)
        
        // Always include the currently selected city in the first 20, even if it would be cut off
        if (cityFilter && !cities.includes(cityFilter)) {
          cities = [cityFilter, ...cities.slice(0, 19)]
        }
      }
    }
    
    return cities
  }, [platform, acncCities, stateCities, stateFilter, locationSearch, showAllLocations, cityFilter])

  // Load organizations
  useEffect(() => {
    const loadOrganizations = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        // Use our new platform-specific API endpoint instead of direct Supabase queries
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: ITEMS_PER_PAGE.toString()
        })
        
        // Apply filters
        if (searchQuery) {
          params.set('search', searchQuery)
        }
        
        if (categoryFilter) {
          params.set('category', categoryFilter)
        }
        
        if (cityFilter && cityFilter !== 'all') {
          params.set('city', cityFilter)
        }
        
        if (stateFilter && stateFilter !== 'all') {
          params.set('state', stateFilter)
        }
        
        if (featuredOnly) {
          params.set('featured', 'true')
        }
        
        if (preferredOnly) {
          params.set('preferred', 'true')
        }
        
        if (purposeFilter) {
          params.set('purpose', purposeFilter)
        }

        const response = await fetch(`/api/${platform}/organizations?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        setState(prev => ({
          ...prev,
          loading: false,
          organizations: data.organizations || [],
          totalCount: data.pagination?.total_results || 0,
          hasMore: data.pagination?.has_next || false,
          error: null
        }))

      } catch (error) {
        console.error('Error loading organizations:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load organizations'
        }))
      }
    }

    loadOrganizations()
  }, [platform, currentPage, searchQuery, categoryFilter, cityFilter, stateFilter, featuredOnly, preferredOnly, purposeFilter])

  // Calculate pagination info
  const totalPages = Math.ceil(state.totalCount / ITEMS_PER_PAGE)
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, state.totalCount)

  return (
    <div className="min-h-screen bg-gray-50">
      {messages && <MultilingualNavbar locale={locale} messages={messages} />}
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {config.name} {config.entityName}
              </h1>
              <p className="text-gray-600 mt-1">
                {state.loading ? 'Loading...' : `${state.totalCount.toLocaleString()} organizations`}
              </p>
            </div>
            
            {platform !== 'acnc' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                defaultValue={searchQuery}
                placeholder="Search organizations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = new URL(window.location.href)
                    url.searchParams.set('search', e.currentTarget.value)
                    url.searchParams.delete('page')
                    window.location.href = url.toString()
                  }
                }}
              />
            </div>
          </div>

          {/* Every.org Category Selection */}
          {platform === 'everyorg' && allCategories.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-sm font-semibold text-green-800 mb-3">Browse by Category</h3>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((category) => {
                  const isDynamic = dynamicCategories.includes(category)
                  const isSelected = categoryFilter === category
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        isSelected
                          ? isDynamic
                            ? 'bg-green-600 text-white'
                            : 'bg-green-600 text-white'
                          : isDynamic
                            ? 'bg-green-200 text-green-800 hover:bg-green-300'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      title={isDynamic ? 'Discovered from nonprofit tags' : 'Popular category'}
                    >
                      {formatCategoryName(category)}
                      {isDynamic && <span className="ml-1 text-xs">🆕</span>}
                    </button>
                  )
                })}
                {categoryFilter && (
                  <button
                    onClick={() => handleCategorySelect('')}
                    className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                    title="Clear category filter"
                  >
                    Clear Category
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ACNC Category Selection */}
          {platform === 'acnc' && acncCategories.length > 0 && (
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="text-sm font-semibold text-amber-800 mb-3">Browse by Category</h3>
              <div className="flex flex-wrap gap-2">
                {acncCategories.map((category) => {
                  const isSelected = categoryFilter === category
                  return (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                      title={`Filter by ${category}`}
                    >
                      {category}
                    </button>
                  )
                })}
                {categoryFilter && (
                  <button
                    onClick={() => handleCategorySelect('')}
                    className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                    title="Clear category filter"
                  >
                    Clear Category
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ACNC State Selection */}
          {platform === 'acnc' && acncStates.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-800 mb-3">Browse by State</h3>
              <div className="flex flex-wrap gap-2">
                {acncStates.map((state) => {
                  const isSelected = stateFilter === state
                  return (
                    <button
                      key={state}
                      onClick={() => handleStateSelect(state)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                      title={`Filter by ${state}`}
                    >
                      {state}
                    </button>
                  )
                })}
                {stateFilter && (
                  <button
                    onClick={() => handleStateSelect('')}
                    className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                    title="Clear state filter"
                  >
                    Clear State
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ACNC Location Selection */}
          {platform === 'acnc' && acncCities.length > 0 && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-yellow-800">
                  Browse by Location{stateFilter && stateFilter !== 'all' ? ` (${stateFilter})` : ''}
                </h3>
                <div className="text-xs text-yellow-600">
                  {(stateFilter && stateFilter !== 'all') ? stateCities.length : acncCities.length} locations available
                </div>
              </div>
              
              {/* Location Search */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3 w-3 text-yellow-600" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    placeholder="Search locations..."
                    className="w-full pl-7 pr-3 py-1 text-sm border border-yellow-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 bg-white"
                  />
                  {locationSearch && (
                    <button
                      onClick={() => setLocationSearch('')}
                      className="absolute right-2 top-2 text-yellow-600 hover:text-yellow-800"
                      title="Clear search"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* City Buttons */}
              <div className="flex flex-wrap gap-2">
                {filteredCities.map((city) => {
                  const isSelected = cityFilter === city
                  return (
                    <button
                      key={city}
                      onClick={() => handleCitySelect(city)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-yellow-600 text-white'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                      title={`Filter by ${city}`}
                    >
                      {city}
                    </button>
                  )
                })}
                
                {/* Show More/Less Button */}
                {(() => {
                  const currentCityList = (stateFilter && stateFilter !== 'all') ? stateCities : acncCities;
                  return !locationSearch && currentCityList.length > 20 && (
                    <button
                      onClick={() => setShowAllLocations(!showAllLocations)}
                      className="px-3 py-1 rounded-full text-sm bg-yellow-200 text-yellow-800 hover:bg-yellow-300 border border-yellow-400"
                      title={showAllLocations ? 'Show fewer locations' : 'Show all locations'}
                    >
                      {showAllLocations ? `Show Less (${currentCityList.length - 20} hidden)` : `Show More (${currentCityList.length - 20} more)`}
                    </button>
                  );
                })()}
                
                {/* Clear Location Filter */}
                {cityFilter && (
                  <button
                    onClick={() => handleCitySelect('')}
                    className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                    title="Clear location filter"
                  >
                    Clear Location
                  </button>
                )}
              </div>

              {/* Search Results Info */}
              {locationSearch && (
                <div className="mt-2 text-xs text-yellow-600">
                  {filteredCities.length === 0 
                    ? `No locations found matching "${locationSearch}"`
                    : `Found ${filteredCities.length} location${filteredCities.length !== 1 ? 's' : ''} matching "${locationSearch}"`
                  }
                </div>
              )}
            </div>
          )}

          {/* ACNC Purposes Selection */}
          {platform === 'acnc' && acncPurposes.length > 0 && (
            <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="text-sm font-semibold text-orange-800 mb-3">Browse by Charitable Purpose</h3>
              <div className="flex flex-wrap gap-2">
                {acncPurposes.map((purpose) => {
                  const isSelected = purposeFilter === purpose
                  return (
                    <button
                      key={purpose}
                      onClick={() => handlePurposeSelect(purpose)}
                      className={`px-3 py-1 rounded-full text-sm transition-colors ${
                        isSelected
                          ? 'bg-orange-600 text-white'
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }`}
                      title={`Filter by ${purpose.replace(/_/g, ' ')}`}
                    >
                      {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  )
                })}
                {purposeFilter && (
                  <button
                    onClick={() => handlePurposeSelect('')}
                    className="px-3 py-1 rounded-full text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                    title="Clear purpose filter"
                  >
                    Clear Purpose
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar - Hidden for ACNC (uses top filters instead) */}
          {showFilters && platform !== 'acnc' && (
            <div className="w-64 flex-shrink-0">
              <OrganizationFilters
                platform={platform}
                entityType={entityType}
                currentFilters={{
                  category: categoryFilter,
                  city: cityFilter,
                  featured: featuredOnly,
                  preferred: preferredOnly,
                  purpose: purposeFilter
                }}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            {/* Results Info */}
            {!state.loading && state.totalCount > 0 && (
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  Showing {startItem}-{endItem} of {state.totalCount.toLocaleString()} organizations
                </p>
                <div className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </div>
              </div>
            )}

            {/* Loading State */}
            {state.loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white rounded-lg border p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {state.error && (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">{state.error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results */}
            {!state.loading && !state.error && state.totalCount === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  No organizations found matching your criteria.
                </p>
                <button
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.search = ''
                    window.location.href = url.toString()
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Organizations Grid */}
            {!state.loading && state.organizations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {state.organizations.map((org) => (
                  <OrganizationCard
                    key={org.id}
                    organization={org}
                    locale={locale}
                    platform={platform}
                    entityType={entityType}
                    onCategorySelect={handleCategorySelect}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!state.loading && totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  {currentPage > 1 && (
                    <a
                      href={`?${new URLSearchParams({ ...searchParams, page: String(currentPage - 1) })}`}
                      className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </a>
                  )}
                  
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                    if (pageNum > totalPages) return null
                    
                    return (
                      <a
                        key={pageNum}
                        href={`?${new URLSearchParams({ ...searchParams, page: String(pageNum) })}`}
                        className={`px-3 py-2 border rounded-lg ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </a>
                    )
                  })}
                  
                  {state.hasMore && (
                    <a
                      href={`?${new URLSearchParams({ ...searchParams, page: String(currentPage + 1) })}`}
                      className="px-3 py-2 bg-white border rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}