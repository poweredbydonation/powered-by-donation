/**
 * Organization Browse Component
 * Unified browse experience for both JustGiving charities and Every.org nonprofits
 */

'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { EntityType } from '@/lib/utils/entity-urls'
import OrganizationCard from '@/components/OrganizationCard'
import OrganizationFilters from '@/components/OrganizationFilters'
import { getEveryOrgClient } from '@/lib/everyorg/client'
import { Search, Filter, ChevronDown, Info, X } from 'lucide-react'
import { parseOperatingCountries } from '@/lib/utils/country-codes'
import { getLocalizedServicesUrl } from '@/lib/utils/localized-urls'

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
    country?: string
    state?: string
    featured?: string
    preferred?: string
    purpose?: string
    beneficiary?: string
  }
}

interface BrowseState {
  organizations: OrganizationCache[]
  loading: boolean
  totalCount: number
  error: string | null
  currentPage: number
}

const ITEMS_PER_PAGE = 12

export default function OrganizationBrowse({
  locale,
  platform,
  entityType,
  messages,
  searchParams
}: OrganizationBrowseProps) {
  // Parse search params with pagination
  const currentPage = parseInt(searchParams.page || '1', 10)
  
  const [state, setState] = useState<BrowseState>({
    organizations: [],
    loading: true,
    totalCount: 0,
    error: null,
    currentPage: currentPage
  })

  const [showFilters, setShowFilters] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [showMobileFooter, setShowMobileFooter] = useState(false)
  const searchQuery = searchParams.search || ''
  const categoryFilter = searchParams.category || ''
  // Parse multiple categories for Every.org (comma-separated)
  const selectedCategories = categoryFilter ? categoryFilter.split(',').filter(Boolean) : []
  const cityFilter = searchParams.city || ''
  const stateFilter = searchParams.state || ''
  const featuredOnly = searchParams.featured === 'true'
  const preferredOnly = searchParams.preferred === 'true'
  const purposeFilter = searchParams.purpose || ''
  const beneficiaryFilter = searchParams.beneficiary || ''

  // Mobile filter selections state
  const [mobileFilters, setMobileFilters] = useState({
    search: searchQuery,
    category: categoryFilter,
    state: stateFilter,
    purpose: purposeFilter,
    city: cityFilter,
    beneficiary: beneficiaryFilter
  })

  // Platform configuration
  const platformConfig = {
    justgiving: {
      name: 'JustGiving',
      entityName: 'Charities',
      entityNameLower: 'charities',
      color: 'purple'
    },
    everyorg: {
      name: 'Every.org',
      entityName: 'Nonprofits',
      entityNameLower: 'nonprofits',
      color: 'green'
    },
    acnc: {
      name: 'ACNC',
      entityName: 'Charities & Nonprofits',
      entityNameLower: 'charities and nonprofits',
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
  const [acncBeneficiaries, setAcncBeneficiaries] = useState<string[]>([])
  
  // Location filter state
  const [locationSearch, setLocationSearch] = useState('')
  const [showAllLocations, setShowAllLocations] = useState(false)
  
  // Dropdown states
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false)
  const [purposeDropdownOpen, setPurposeDropdownOpen] = useState(false)
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false)
  const [beneficiaryDropdownOpen, setBeneficiaryDropdownOpen] = useState(false)
  
  // JustGiving dropdown states
  const [justgivingCityDropdownOpen, setJustgivingCityDropdownOpen] = useState(false)
  
  // ACNC state system
  const [acncStates, setAcncStates] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>(stateFilter)
  const [stateCities, setStateCities] = useState<string[]>([])
  
  
  // JustGiving city system  
  const [justgivingCities, setJustgivingCities] = useState<string[]>([])
  
  // Every.org state/city system - REMOVED (no structured location data in address fields)
  
  // Initialize Every.org categories from database
  useEffect(() => {
    if (platform === 'everyorg') {
      const loadEveryOrgData = async () => {
        try {
          const supabase = createClient()
          
          // Load filter data from lookup table (much faster)
          const { data: categoriesResult, error } = await supabase
            .from('everyorg_categories_lookup')
            .select('category')
            .order('category')

          if (error) {
            console.error('Error loading Every.org categories from lookup:', error)
            // Fallback to hardcoded categories
            const client = getEveryOrgClient()
            const popularCategories = client.getPopularCauses()
            setEveryOrgCategories(popularCategories)
            return
          }

          if (categoriesResult && categoriesResult.length > 0) {
            setEveryOrgCategories(categoriesResult.map(item => item.category))
          } else {
            // Fallback to hardcoded categories if no data in lookup table
            const client = getEveryOrgClient()
            const popularCategories = client.getPopularCauses()
            setEveryOrgCategories(popularCategories)
          }
          
          // Check if current category filter is not in loaded categories and add it to dynamic
          if (categoryFilter && categoriesResult && categoriesResult.length > 0) {
            const loadedCategories = categoriesResult.map(item => item.category)
            if (!loadedCategories.includes(categoryFilter)) {
              setDynamicCategories(prev => 
                prev.includes(categoryFilter) ? prev : [...prev, categoryFilter]
              )
            }
          }
        } catch (error) {
          console.error('Failed to load Every.org data:', error)
          // Fallback to hardcoded categories
          try {
            const client = getEveryOrgClient()
            const popularCategories = client.getPopularCauses()
            setEveryOrgCategories(popularCategories)
          } catch (fallbackError) {
            console.error('Failed to initialize Every.org client:', fallbackError)
          }
        }
      }
      
      loadEveryOrgData()
    }
  }, [platform, categoryFilter])

  // Initialize ACNC data (purposes, categories, cities)
  useEffect(() => {
    if (platform === 'acnc') {
      const loadAcncData = async () => {
        try {
          const supabase = createClient()
          
          // Load filter data from lookup tables (much faster)
          const [categoriesResult, purposesResult, beneficiariesResult, citiesResult, statesResult] = await Promise.all([
            supabase.from('acnc_categories_lookup').select('category').order('category'),
            supabase.from('acnc_purposes_lookup').select('purpose').order('purpose'),
            supabase.from('acnc_beneficiaries_lookup').select('beneficiary').order('beneficiary'),
            supabase.from('acnc_cities_lookup').select('city').order('city'),
            supabase.from('acnc_states_lookup').select('state').order('state')
          ])

          if (categoriesResult.data) {
            setAcncCategories(categoriesResult.data.map(item => item.category))
          }
          if (purposesResult.data) {
            setAcncPurposes(purposesResult.data.map(item => item.purpose))
          }
          if (beneficiariesResult.data) {
            setAcncBeneficiaries(beneficiariesResult.data.map(item => item.beneficiary))
          }
          if (citiesResult.data) {
            setAcncCities(citiesResult.data.map(item => item.city))
          }
          if (statesResult.data) {
            setAcncStates(statesResult.data.map(item => item.state))
          }
        } catch (error) {
          console.error('Failed to load ACNC filter data:', error)
        }
      }
      
      loadAcncData()
    }
  }, [platform])

  // Initialize JustGiving data (countries, cities)
  useEffect(() => {
    if (platform === 'justgiving') {
      const loadJustgivingData = async () => {
        try {
          const supabase = createClient()
          
          // Load cities from lookup table (much faster)
          // Fetch in multiple batches to get all cities
          let allCities = []
          let start = 0
          const batchSize = 1000
          
          while (true) {
            const { data: batch, error } = await supabase
              .from('justgiving_cities_lookup')
              .select('city')
              .order('city')
              .range(start, start + batchSize - 1)
            
            if (error) {
              console.error('Failed to load JustGiving cities batch:', error)
              break
            }
            
            if (!batch || batch.length === 0) break
            
            allCities.push(...batch)
            
            if (batch.length < batchSize) break // Last batch
            
            start += batchSize
          }
          
          const citiesResult = allCities

          if (citiesResult && citiesResult.length > 0) {
            const cities = citiesResult.map(item => item.city)
            console.log('Loaded JustGiving cities:', cities.length, cities.slice(0, 5))
            setJustgivingCities(cities)
          } else {
            console.log('No JustGiving cities loaded')
          }
        } catch (error) {
          console.error('Failed to load JustGiving data:', error)
        }
      }
      
      loadJustgivingData()
    }
  }, [platform])

  // Every.org data initialization - REMOVED (no structured location data available)

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


  // Every.org city loading - REMOVED (no structured location data available)

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
    
    if (platform === 'everyorg') {
      // Multi-select for Every.org
      let newCategories = [...selectedCategories]
      
      if (newCategories.includes(category)) {
        // Remove if already selected
        newCategories = newCategories.filter(c => c !== category)
      } else {
        // Add if not selected
        newCategories.push(category)
      }
      
      if (newCategories.length === 0) {
        url.searchParams.delete('category')
      } else {
        url.searchParams.set('category', newCategories.join(','))
      }
      
      // Add category to dynamic categories if it's not already in default categories and not already added
      if (!everyOrgCategories.includes(category) && !dynamicCategories.includes(category)) {
        setDynamicCategories(prev => [...prev, category])
      }
    } else {
      // Single-select for ACNC and other platforms
      if (category === categoryFilter) {
        url.searchParams.delete('category')
      } else {
        url.searchParams.set('category', category)
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

  // Handle single filter selection
  const selectFilter = (type: string, value: string) => {
    setMobileFilters(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev] === value ? '' : value
    }))
  }

  // Apply filters
  const applyMobileFilters = () => {
    const url = new URL(window.location.href)
    
    // Clear existing filters
    url.searchParams.delete('category')
    url.searchParams.delete('state') 
    url.searchParams.delete('purpose')
    url.searchParams.delete('city')
    url.searchParams.delete('search')
    url.searchParams.delete('beneficiary')
    url.searchParams.delete('page')
    
    // Apply new filters
    if (mobileFilters.search.trim()) {
      url.searchParams.set('search', mobileFilters.search.trim())
    }
    
    if (mobileFilters.category) {
      url.searchParams.set('category', mobileFilters.category)
    }
    
    if (mobileFilters.state) {
      url.searchParams.set('state', mobileFilters.state)
    }
    
    if (mobileFilters.purpose) {
      url.searchParams.set('purpose', mobileFilters.purpose)
    }
    
    if (mobileFilters.city) {
      url.searchParams.set('city', mobileFilters.city)
    }
    
    if (mobileFilters.beneficiary) {
      url.searchParams.set('beneficiary', mobileFilters.beneficiary)
    }
    
    
    // Close modal and navigate
    setShowMobileFilters(false)
    window.location.href = url.toString()
  }

  // Clear all mobile filters
  const clearMobileFilters = () => {
    setMobileFilters({
      search: '',
      category: '',
      state: '',
      purpose: '',
      city: '',
      beneficiary: '',
    })
  }

  // Initialize mobile filters when modal opens
  const openMobileFilters = () => {
    setMobileFilters({
      search: searchQuery,
      category: categoryFilter,
      state: stateFilter,
      purpose: purposeFilter,
      city: cityFilter,
      beneficiary: beneficiaryFilter,
    })
    setShowMobileFilters(true)
  }

  // Handle ACNC beneficiary selection
  const handleBeneficiarySelect = (beneficiary: string) => {
    const url = new URL(window.location.href)
    if (beneficiary === beneficiaryFilter) {
      url.searchParams.delete('beneficiary')
    } else {
      url.searchParams.set('beneficiary', beneficiary)
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


  // Handle JustGiving city selection  
  const handleJustgivingCitySelect = (city: string) => {
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

  // Every.org state/city handlers - REMOVED (no structured location data available)

  // Combined categories for Every.org
  const allCategories = platform === 'everyorg' 
    ? [...everyOrgCategories, ...dynamicCategories]
    : []


  // Filtered cities for location search (ACNC and JustGiving)
  const filteredCities = useMemo(() => {
    if (platform === 'acnc') {
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
      }
      // Note: Don't slice here - let the render logic handle show more/less
      
      return cities
    } else if (platform === 'justgiving') {
      // Use all JustGiving cities from lookup table
      let cities = justgivingCities
      
      // Apply search filter
      if (locationSearch.trim()) {
        cities = cities.filter(city => 
          city.toLowerCase().includes(locationSearch.toLowerCase().trim())
        )
        
        // Always include the currently selected city in search results, even if it doesn't match
        if (cityFilter && !cities.includes(cityFilter)) {
          cities = [cityFilter, ...cities]
        }
      }
      // Note: Don't slice here for JustGiving either - let render handle it
      
      return cities
    }
    
    return []
  }, [platform, acncCities, stateCities, stateFilter, justgivingCities, locationSearch, showAllLocations, cityFilter])

  // Load organizations function for pagination
  const loadOrganizations = useCallback(async (page: number) => {
    setState(prev => ({ ...prev, loading: true, error: null, currentPage: page, organizations: [] }))
    
    try {
      // Use our new platform-specific API endpoint instead of direct Supabase queries
      const params = new URLSearchParams({
        page: page.toString(),
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

      if (beneficiaryFilter) {
        params.set('beneficiary', beneficiaryFilter)
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
        currentPage: page,
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
  }, [platform, searchQuery, categoryFilter, cityFilter, stateFilter, featuredOnly, preferredOnly, purposeFilter, beneficiaryFilter])

  // Prevent duplicate API calls with a ref
  const loadingRef = useRef(false)

  // Initial load and filter changes
  useEffect(() => {
    // Prevent duplicate calls
    if (loadingRef.current) return
    
    loadingRef.current = true
    loadOrganizations(currentPage).finally(() => {
      loadingRef.current = false
    })
  }, [loadOrganizations, currentPage])

  // Pagination helper functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      const url = new URL(window.location.href)
      url.searchParams.set('page', page.toString())
      window.location.href = url.toString() // Use navigation instead of pushState
    }
  }

  // Calculate pagination info
  const totalPages = Math.ceil(state.totalCount / ITEMS_PER_PAGE)
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, state.totalCount)
  

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Check each dropdown individually to avoid closing all when clicking on one
      if (!target.closest('[data-dropdown="category"]')) {
        setCategoryDropdownOpen(false)
      }
      if (!target.closest('[data-dropdown="state"]')) {
        setStateDropdownOpen(false)
      }
      if (!target.closest('[data-dropdown="purpose"]')) {
        setPurposeDropdownOpen(false)
      }
      if (!target.closest('[data-dropdown="location"]')) {
        setLocationDropdownOpen(false)
      }
      if (!target.closest('[data-dropdown="beneficiary"]')) {
        setBeneficiaryDropdownOpen(false)
      }
      if (!target.closest('[data-dropdown="justgiving-city"]')) {
        setJustgivingCityDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset show all locations when search changes
  useEffect(() => {
    setShowAllLocations(false)
  }, [locationSearch])

  return (
    <div className="bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                {platform === 'justgiving' && (
                  <img
                    src="/justgiving-logo.svg"
                    alt="JustGiving"
                    className="h-8 w-auto"
                  />
                )}
                {platform === 'everyorg' && (
                  <img
                    src="/Logo_Green.svg"
                    alt="Every.org"
                    className="h-8 w-auto"
                  />
                )}
                <h1 className="text-2xl font-bold text-gray-900">
                  {platform === 'justgiving' ? config.entityName : `${config.name} ${config.entityName}`}
                </h1>
              </div>
              <p className="text-gray-600 mt-1">
                {state.loading ? 'Loading...' : 'Browse and discover organizations'}
                {(platform === 'acnc' || platform === 'everyorg') && (
                  <span className="hidden md:inline ml-2 text-sm text-gray-500">
                    • Use the filter button to search and filter
                  </span>
                )}
              </p>
            </div>
            
            {/* Results Counter - Right Aligned */}
            {!state.loading && state.totalCount > 0 && (
              <div className="text-right">
                <div className={`inline-flex items-center px-4 py-2 rounded-lg font-medium text-base ${
                  platform === 'justgiving' 
                    ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                    : platform === 'everyorg'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-orange-50 text-orange-700 border border-orange-200'
                }`}>
                  <span className="mr-2">🎯</span>
                  Showing {state.totalCount.toLocaleString()} {config.entityNameLower}
                </div>
              </div>
            )}
          </div>

          {/* Search Bar and Platform Filters Row - Hidden when using modal filters */}
          {platform === 'justgiving' ? (
            <div className="mt-4 flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    defaultValue={searchQuery}
                    placeholder="Search organizations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A04DD] focus:border-transparent"
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
              
              
              {/* Inline City Filter */}
              {justgivingCities.length > 0 && (
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <div className="relative" data-dropdown="justgiving-city">
                    <button
                      onClick={() => setJustgivingCityDropdownOpen(!justgivingCityDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-[#7A04DD] focus:border-[#7A04DD] flex items-center justify-between"
                    >
                      <span className={cityFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {cityFilter || 'Select location...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {justgivingCityDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                        {/* Search Input */}
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              placeholder="Search locations..."
                              className="w-full pl-7 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#7A04DD] focus:border-[#7A04DD]"
                            />
                          </div>
                        </div>
                        
                        {/* Options */}
                        <div className="max-h-48 overflow-y-auto">
                          {cityFilter && (
                            <button
                              onClick={() => {
                                handleJustgivingCitySelect('')
                                setJustgivingCityDropdownOpen(false)
                                setLocationSearch('')
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                            >
                              Clear selection
                            </button>
                          )}
                          {(showAllLocations ? filteredCities : filteredCities.slice(0, 20)).map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                handleJustgivingCitySelect(city)
                                setJustgivingCityDropdownOpen(false)
                                setLocationSearch('')
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 ${
                                cityFilter === city ? 'bg-purple-100 text-purple-800 font-medium' : 'text-gray-700'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                          {!showAllLocations && filteredCities.length > 20 && (
                            <button
                              onClick={() => setShowAllLocations(true)}
                              className="w-full px-3 py-2 text-xs text-[#7A04DD] hover:bg-purple-50 border-t bg-white"
                            >
                              Show More ({filteredCities.length - 20} more)
                            </button>
                          )}
                          {showAllLocations && filteredCities.length > 20 && (
                            <button
                              onClick={() => setShowAllLocations(false)}
                              className="w-full px-3 py-2 text-xs text-[#7A04DD] hover:bg-purple-50 border-t bg-white"
                            >
                              Show Less
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : platform === 'acnc' ? (
            /* ACNC Search and Filters Row - Hidden on mobile */
            <div className="hidden md:flex mt-4 flex-col xl:flex-row gap-3 items-start xl:items-end">
              {/* Search Bar */}
              <div className="flex-1 max-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    defaultValue={searchQuery}
                    placeholder="Search organizations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A04DD] focus:border-transparent"
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
              
              {/* Inline Category Filter */}
              {acncCategories.length > 0 && (
                <div className="w-full xl:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="relative" data-dropdown="category">
                    <button
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 flex items-center justify-between"
                    >
                      <span className={categoryFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {categoryFilter || 'Category...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {categoryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {categoryFilter && (
                          <button
                            onClick={() => {
                              handleCategorySelect('')
                              setCategoryDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear selection
                          </button>
                        )}
                        {acncCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => {
                              handleCategorySelect(category)
                              setCategoryDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-amber-50 ${
                              categoryFilter === category ? 'bg-amber-100 text-amber-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inline State Filter */}
              {acncStates.length > 0 && (
                <div className="w-full xl:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <div className="relative" data-dropdown="state">
                    <button
                      onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-[#7A04DD] focus:border-[#7A04DD] flex items-center justify-between"
                    >
                      <span className={stateFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {stateFilter || 'State...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {stateDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {stateFilter && (
                          <button
                            onClick={() => {
                              handleStateSelect('')
                              setStateDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear selection
                          </button>
                        )}
                        {acncStates.map((state) => (
                          <button
                            key={state}
                            onClick={() => {
                              handleStateSelect(state)
                              setStateDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 ${
                              stateFilter === state ? 'bg-purple-100 text-purple-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {state}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inline Purpose Filter */}
              {acncPurposes.length > 0 && (
                <div className="w-full xl:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
                  <div className="relative" data-dropdown="purpose">
                    <button
                      onClick={() => setPurposeDropdownOpen(!purposeDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex items-center justify-between"
                    >
                      <span className={purposeFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {purposeFilter ? purposeFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Purpose...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {purposeDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {purposeFilter && (
                          <button
                            onClick={() => {
                              handlePurposeSelect('')
                              setPurposeDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear selection
                          </button>
                        )}
                        {acncPurposes.map((purpose) => (
                          <button
                            key={purpose}
                            onClick={() => {
                              handlePurposeSelect(purpose)
                              setPurposeDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-orange-50 ${
                              purposeFilter === purpose ? 'bg-orange-100 text-orange-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inline Location Filter */}
              {acncCities.length > 0 && (
                <div className="w-full xl:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location{stateFilter && stateFilter !== 'all' ? ` (${stateFilter})` : ''}
                  </label>
                  <div className="relative" data-dropdown="location">
                    <button
                      onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 flex items-center justify-between"
                    >
                      <span className={cityFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {cityFilter || 'Location...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {locationDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
                        {/* Search Input */}
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
                            <input
                              type="text"
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              placeholder="Search locations..."
                              className="w-full pl-7 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                          </div>
                        </div>
                        
                        {/* Options */}
                        <div className="max-h-56 overflow-y-auto">
                          {cityFilter && (
                            <button
                              onClick={() => {
                                handleCitySelect('')
                                setLocationDropdownOpen(false)
                                setLocationSearch('')
                                setShowAllLocations(false)
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                            >
                              Clear selection
                            </button>
                          )}
                          {filteredCities.map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                handleCitySelect(city)
                                setLocationDropdownOpen(false)
                                setLocationSearch('')
                                setShowAllLocations(false)
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-yellow-50 ${
                                cityFilter === city ? 'bg-yellow-100 text-yellow-800 font-medium' : 'text-gray-700'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                        {/* Show More/Less buttons outside scrollable area */}
                        {((stateFilter && stateFilter !== 'all') ? stateCities : acncCities).length > 20 && !showAllLocations && !locationSearch.trim() && (
                          <button
                            onClick={() => setShowAllLocations(true)}
                            className="w-full px-3 py-2 text-xs text-[#7A04DD] hover:bg-purple-50 border-t bg-white"
                          >
                            Show More ({((stateFilter && stateFilter !== 'all') ? stateCities : acncCities).length - 20} more)
                          </button>
                        )}
                        {showAllLocations && ((stateFilter && stateFilter !== 'all') ? stateCities : acncCities).length > 20 && !locationSearch.trim() && (
                          <button
                            onClick={() => setShowAllLocations(false)}
                            className="w-full px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 border-t bg-white"
                          >
                            Show Less
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inline Beneficiaries Filter */}
              {acncBeneficiaries.length > 0 && (
                <div className="w-full xl:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiaries</label>
                  <div className="relative" data-dropdown="beneficiary">
                    <button
                      onClick={() => setBeneficiaryDropdownOpen(!beneficiaryDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 flex items-center justify-between"
                    >
                      <span className={beneficiaryFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {beneficiaryFilter ? beneficiaryFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Beneficiaries...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {beneficiaryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {beneficiaryFilter && (
                          <button
                            onClick={() => {
                              handleBeneficiarySelect('')
                              setBeneficiaryDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear selection
                          </button>
                        )}
                        {acncBeneficiaries.map((beneficiary) => (
                          <button
                            key={beneficiary}
                            onClick={() => {
                              handleBeneficiarySelect(beneficiary)
                              setBeneficiaryDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 ${
                              beneficiaryFilter === beneficiary ? 'bg-purple-100 text-purple-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {beneficiary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
            </div>
          ) : platform === 'everyorg' ? (
            /* Every.org Search Bar + Category Dropdown - Hidden on mobile */
            <div className="hidden md:flex mt-4 flex-col lg:flex-row gap-4 items-start lg:items-end">
              {/* Search Bar */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    defaultValue={searchQuery}
                    placeholder="Search organizations..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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

              {/* Category Filter */}
              {allCategories.length > 0 && (
                <div className="w-full lg:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="relative" data-dropdown="category">
                    <button
                      onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 flex items-center justify-between"
                    >
                      <span className={selectedCategories.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                        {selectedCategories.length === 0 
                          ? 'Categories...' 
                          : selectedCategories.length === 1 
                            ? formatCategoryName(selectedCategories[0])
                            : `${selectedCategories.length} categories selected`
                        }
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {categoryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {selectedCategories.length > 0 && (
                          <button
                            onClick={() => {
                              const url = new URL(window.location.href)
                              url.searchParams.delete('category')
                              url.searchParams.delete('page')
                              window.location.href = url.toString()
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear all selections
                          </button>
                        )}
                        {allCategories.map((category) => {
                          const isDynamic = dynamicCategories.includes(category)
                          return (
                            <button
                              key={category}
                              onClick={() => {
                                handleCategorySelect(category)
                                // Don't close dropdown for multi-select
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-green-50 flex items-center ${
                                selectedCategories.includes(category) ? 'bg-green-100 text-green-800' : 'text-gray-700'
                              }`}
                              title={isDynamic ? 'Discovered from nonprofit tags' : 'Category'}
                            >
                              <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={() => {}} // Handled by parent button
                                className="mr-2 h-3 w-3 text-green-600 rounded focus:ring-green-500"
                              />
                              {formatCategoryName(category)}
                              {isDynamic && <span className="ml-1 text-xs">🆕</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Search Bar for ACNC and Every.org platforms - Mobile only */
            <div className="mt-4 md:hidden">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  defaultValue={searchQuery}
                  placeholder="Search organizations..."
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${
                    platform === 'acnc' 
                      ? 'focus:ring-orange-500' 
                      : 'focus:ring-green-500'
                  }`}
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
          )}

          {/* Every.org State Selection - REMOVED (no structured location data) */}

          {/* Every.org Location Selection - REMOVED (no structured location data) */}
          {/* Location filtering note - Hidden since we use filter modal for everything */}
          {platform === 'everyorg' && (
            <div className="hidden mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-yellow-800">Location Filtering</h3>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Note</span>
              </div>
              <p className="text-sm text-yellow-700">
                Every.org organizations contain location information in their descriptions, but not in structured address fields. 
                Use the search bar above to find organizations by location (e.g., &quot;San Francisco&quot;, &quot;Texas&quot;, &quot;California&quot;).
              </p>
            </div>
          )}

          {/* JustGiving filters moved to inline row above */}

          {/* ACNC filters moved to inline row above */}

          {/* Results Content */}
        <div className="mt-8">
          {/* Filter Summary */}
          {(categoryFilter || cityFilter || stateFilter || searchQuery || purposeFilter || beneficiaryFilter || featuredOnly || preferredOnly) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-700">Active Filters:</h3>
                <button
                  onClick={() => {
                    const url = new URL(window.location.href)
                    url.search = ''
                    window.location.href = url.toString()
                  }}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All Filters
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Search: &quot;{searchQuery}&quot;
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('search')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedCategories.length > 0 && (
                  platform === 'everyorg' ? (
                    // Multi-category display for Every.org
                    selectedCategories.map((category) => (
                      <span key={category} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Category: {formatCategoryName(category)}
                        <button
                          onClick={() => {
                            handleCategorySelect(category)
                          }}
                          className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  ) : (
                    // Single category display for ACNC
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                      Category: {categoryFilter}
                      <button
                        onClick={() => {
                          const url = new URL(window.location.href)
                          url.searchParams.delete('category')
                          url.searchParams.delete('page')
                          window.location.href = url.toString()
                        }}
                        className="ml-1 hover:bg-amber-200 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )
                )}
                {stateFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    State: {stateFilter}
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('state')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-purple-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {purposeFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    Purpose: {purposeFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('purpose')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-orange-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {cityFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-sky-100 text-sky-800">
                    Location: {cityFilter}
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('city')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-sky-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {beneficiaryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                    Beneficiaries: {beneficiaryFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('beneficiary')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-indigo-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {featuredOnly && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Featured Only
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('featured')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-yellow-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {preferredOnly && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-800">
                    Preferred by Services
                    <button
                      onClick={() => {
                        const url = new URL(window.location.href)
                        url.searchParams.delete('preferred')
                        url.searchParams.delete('page')
                        window.location.href = url.toString()
                      }}
                      className="ml-1 hover:bg-pink-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
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
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
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
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            )}

            {/* No Results - Only show when filters are applied */}
            {!state.loading && !state.error && state.organizations.length === 0 && (categoryFilter || cityFilter || stateFilter || searchQuery || purposeFilter || beneficiaryFilter || featuredOnly || preferredOnly) && (
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
                  className="px-4 py-2 bg-[#7A04DD] text-white rounded-lg hover:bg-[#540099]"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Organizations Grid */}
            {(!state.loading && state.organizations.length > 0) && (
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


            {/* Industry Standard Pagination */}
            {totalPages > 1 && (
              <nav className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6" aria-label="Pagination">
                <div className="hidden sm:block">
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startItem}</span> to{' '}
                    <span className="font-medium">{endItem}</span> of{' '}
                    <span className="font-medium">{state.totalCount.toLocaleString()}</span> results
                  </p>
                </div>
                <div className="flex flex-1 justify-between sm:justify-end">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
                      currentPage === 1
                        ? 'text-gray-300 ring-gray-300 cursor-not-allowed'
                        : `text-gray-900 ring-gray-300 hover:bg-${platform === 'acnc' ? 'orange' : platform === 'everyorg' ? 'green' : 'blue'}-50`
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Desktop page numbers */}
                  <div className="hidden md:flex">
                    {(() => {
                      const pages = []
                      const delta = 2 // Show 2 pages on each side of current
                      const range = []
                      const rangeWithDots = []
                      
                      for (let i = Math.max(2, currentPage - delta); 
                           i <= Math.min(totalPages - 1, currentPage + delta); 
                           i++) {
                        range.push(i)
                      }
                      
                      if (currentPage - delta > 2) {
                        rangeWithDots.push(1, '...')
                      } else {
                        rangeWithDots.push(1)
                      }
                      
                      rangeWithDots.push(...range)
                      
                      if (currentPage + delta < totalPages - 1) {
                        rangeWithDots.push('...', totalPages)
                      } else if (totalPages > 1) {
                        rangeWithDots.push(totalPages)
                      }
                      
                      return rangeWithDots.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`dots-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300">
                              ...
                            </span>
                          )
                        }
                        
                        const pageNum = page as number
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            aria-current={pageNum === currentPage ? 'page' : undefined}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              pageNum === currentPage
                                ? `z-10 bg-${platform === 'acnc' ? 'orange' : platform === 'everyorg' ? 'green' : 'blue'}-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-${platform === 'acnc' ? 'orange' : platform === 'everyorg' ? 'green' : 'blue'}-600`
                                : `text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-${platform === 'acnc' ? 'orange' : platform === 'everyorg' ? 'green' : 'blue'}-50 focus:z-20 focus:outline-offset-0`
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })
                    })()}
                  </div>
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`relative ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold ring-1 ring-inset ${
                      currentPage === totalPages
                        ? 'text-gray-300 ring-gray-300 cursor-not-allowed'
                        : `text-gray-900 ring-gray-300 hover:bg-${platform === 'acnc' ? 'orange' : platform === 'everyorg' ? 'green' : 'blue'}-50`
                    }`}
                  >
                    Next
                  </button>
                </div>
              </nav>
            )}
          </div>
        </div>

        {/* Filters Sidebar - Hidden for ACNC and Every.org (use modal filters instead) */}
        {showFilters && platform !== 'acnc' && platform !== 'everyorg' && (
          <div className="lg:w-80">
            <OrganizationFilters
              platform={platform}
              entityType={entityType}
              currentFilters={{
                category: categoryFilter,
                city: cityFilter,
                purpose: purposeFilter,
                featured: featuredOnly,
                preferred: preferredOnly
              }}
            />
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowFilters(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Hide Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Button - All platforms, all screen sizes */}
      {(platform === 'acnc' || platform === 'everyorg') && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
          <button
            onClick={openMobileFilters}
            className={`${
              platform === 'acnc' 
                ? 'bg-orange-600 hover:bg-orange-700' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105`}
          >
            <Filter className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Filter Modal - ACNC and Every.org */}
      {(platform === 'acnc' || platform === 'everyorg') && showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end md:items-center md:justify-end md:pr-6 md:pb-20">
          <div className="bg-white rounded-t-2xl md:rounded-2xl w-full md:w-96 max-h-[80vh] md:max-h-[70vh] overflow-y-auto md:shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={clearMobileFilters}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-6">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={mobileFilters.search}
                    onChange={(e) => setMobileFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="Search organizations..."
                    className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent ${
                      platform === 'acnc' ? 'focus:ring-orange-500' : 'focus:ring-green-500'
                    }`}
                  />
                </div>
              </div>

              {/* Category Filter - Platform-aware */}
              {((platform === 'acnc' && acncCategories.length > 0) || (platform === 'everyorg' && allCategories.length > 0)) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <div className="relative">
                    <select
                      value={mobileFilters.category}
                      onChange={(e) => setMobileFilters(prev => ({ ...prev, category: e.target.value }))}
                      className={`w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent appearance-none bg-white ${
                        platform === 'acnc' 
                          ? 'focus:ring-orange-500' 
                          : 'focus:ring-green-500'
                      }`}
                    >
                      <option value="">All Categories</option>
                      {(platform === 'acnc' ? acncCategories : allCategories).map((category) => (
                        <option key={category} value={category}>
                          {platform === 'everyorg' ? formatCategoryName(category) : category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* State Filter - ACNC only */}
              {platform === 'acnc' && acncStates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                  <div className="relative">
                    <select
                      value={mobileFilters.state}
                      onChange={(e) => setMobileFilters(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7A04DD] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">All States</option>
                      {acncStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Purpose Filter - ACNC only */}
              {platform === 'acnc' && acncPurposes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Purpose</label>
                  <div className="relative">
                    <select
                      value={mobileFilters.purpose}
                      onChange={(e) => setMobileFilters(prev => ({ ...prev, purpose: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">All Purposes</option>
                      {acncPurposes.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Location Filter - ACNC only */}
              {platform === 'acnc' && acncCities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <div className="relative">
                    <select
                      value={mobileFilters.city}
                      onChange={(e) => setMobileFilters(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">All Locations</option>
                      {(stateFilter && stateFilter !== 'all' ? stateCities : acncCities).map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Beneficiaries Filter - ACNC only */}
              {platform === 'acnc' && acncBeneficiaries.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Beneficiaries</label>
                  <div className="relative">
                    <select
                      value={mobileFilters.beneficiary}
                      onChange={(e) => setMobileFilters(prev => ({ ...prev, beneficiary: e.target.value }))}
                      className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">All Beneficiaries</option>
                      {acncBeneficiaries.map((beneficiary) => (
                        <option key={beneficiary} value={beneficiary}>
                          {beneficiary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}


              {/* Every.org Location Filtering Note - Mobile only */}
              {platform === 'everyorg' && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-yellow-800">Location Filtering</h3>
                    <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Note</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Every.org organizations contain location information in their descriptions, but not in structured address fields. 
                    Use the search bar above to find organizations by location (e.g., &quot;San Francisco&quot;, &quot;Texas&quot;, &quot;California&quot;).
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer - Apply Filters Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={applyMobileFilters}
                  className={`flex-1 px-4 py-3 text-white rounded-lg transition-colors font-medium ${
                    platform === 'acnc' 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Footer Access Button */}
      <div className="md:hidden fixed bottom-6 left-6 z-40">
        <button
          onClick={() => setShowMobileFooter(true)}
          className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105"
          aria-label="View footer information"
        >
          <Info className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Footer Modal */}
      {showMobileFooter && (
        <div className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Site Information</h3>
                <button
                  onClick={() => setShowMobileFooter(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content - Footer Content */}
            <div className="p-4 pb-8">
              {/* Trust & Transparency Section */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Trust & Transparency</h4>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-green-600 mr-2">♥</span>
                      <span className="font-medium text-sm">No Platform Fees</span>
                    </div>
                    <p className="text-xs text-gray-600 ml-6">
                      100% of donations go directly to charities via JustGiving. We never take fees from donations.
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-gray-700 mr-2">⌨</span>
                      <span className="font-medium text-sm">Open Source</span>
                    </div>
                    <p className="text-xs text-gray-600 ml-6">
                      Our platform is transparent - view our source code on GitHub.
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Platform</h4>
                  <ul className="space-y-2 text-xs">
                    <li><a href={getLocalizedServicesUrl(locale)} className="text-gray-600 hover:text-gray-900">Browse Services</a></li>
                    <li><a href={`/${locale}/dashboard`} className="text-gray-600 hover:text-gray-900">For Fundraisers</a></li>
                    <li><a href={`/${locale}/justgiving/charities`} className="text-gray-600 hover:text-gray-900">Featured Charities</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Legal</h4>
                  <ul className="space-y-2 text-xs">
                    <li><a href={`/${locale}/privacy`} className="text-gray-600 hover:text-gray-900">Privacy Policy</a></li>
                    <li><a href={`/${locale}/terms`} className="text-gray-600 hover:text-gray-900">Terms of Service</a></li>
                    <li><a href={`/${locale}/about`} className="text-gray-600 hover:text-gray-900">About Us</a></li>
                    <li><a href={`/${locale}/contact`} className="text-gray-600 hover:text-gray-900">Contact</a></li>
                  </ul>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="border-t border-gray-200 pt-4">
                <div className="text-xs text-gray-500 space-y-2">
                  <div>© 2025 Powered by Donation</div>
                  <div>ABN: 17 927 784 658</div>
                  <div>Made in Australia</div>
                  <div className="flex items-center">
                    <span>Powered by </span>
                    <a 
                      href="https://www.justgiving.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[#7A04DD] hover:text-[#540099] ml-1"
                    >
                      JustGiving
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

