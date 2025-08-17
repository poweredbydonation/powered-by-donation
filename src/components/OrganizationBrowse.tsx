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
import { getEveryOrgClient } from '@/lib/everyorg/client'
import { Search, Filter, ChevronDown } from 'lucide-react'
import { parseOperatingCountries } from '@/lib/utils/country-codes'

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
    operating_country?: string
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
  const countryFilter = searchParams.country || ''
  const stateFilter = searchParams.state || ''
  const operatingCountryFilter = searchParams.operating_country || ''
  const featuredOnly = searchParams.featured === 'true'
  const preferredOnly = searchParams.preferred === 'true'
  const purposeFilter = searchParams.purpose || ''
  const beneficiaryFilter = searchParams.beneficiary || ''

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
  const [operatingCountryDropdownOpen, setOperatingCountryDropdownOpen] = useState(false)
  
  // JustGiving dropdown states
  const [justgivingCountryDropdownOpen, setJustgivingCountryDropdownOpen] = useState(false)
  const [justgivingCityDropdownOpen, setJustgivingCityDropdownOpen] = useState(false)
  
  // ACNC state system
  const [acncStates, setAcncStates] = useState<string[]>([])
  const [selectedState, setSelectedState] = useState<string>(stateFilter)
  const [stateCities, setStateCities] = useState<string[]>([])
  
  // ACNC operating countries system
  const [acncOperatingCountries, setAcncOperatingCountries] = useState<string[]>([])
  const [selectedOperatingCountry, setSelectedOperatingCountry] = useState<string>(searchParams.operating_country || '')
  
  // JustGiving country/city system
  const [justgivingCountries, setJustgivingCountries] = useState<string[]>([])
  const [justgivingCities, setJustgivingCities] = useState<string[]>([])
  const [selectedCountry, setSelectedCountry] = useState<string>(countryFilter)
  const [countryCities, setCountryCities] = useState<string[]>([])
  
  // Every.org state/city system - REMOVED (no structured location data in address fields)
  
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
            .select('acnc_purposes, acnc_beneficiaries, category, address_city, acnc_operates_in_act, acnc_operates_in_nsw, acnc_operates_in_nt, acnc_operates_in_qld, acnc_operates_in_sa, acnc_operates_in_tas, acnc_operates_in_vic, acnc_operates_in_wa, acnc_operating_countries')
            .eq('platform', 'acnc')
            .eq('is_active', true)
            .not('acnc_operating_countries', 'is', null)
            .neq('acnc_operating_countries', '')
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

            // Extract beneficiaries
            const beneficiarySet = new Set<string>()
            organizations.forEach(org => {
              if (org.acnc_beneficiaries && typeof org.acnc_beneficiaries === 'object') {
                Object.entries(org.acnc_beneficiaries).forEach(([beneficiary, value]) => {
                  if (value === true || value === 'true') {
                    beneficiarySet.add(beneficiary)
                  }
                })
              }
            })
            const beneficiaries = Array.from(beneficiarySet).sort()
            console.log('ACNC beneficiaries found:', beneficiaries.length, beneficiaries.slice(0, 5))
            setAcncBeneficiaries(beneficiaries)

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

            // Extract operating countries (convert ISO codes to country names)
            const operatingCountrySet = new Set<string>()
            const rawCountryData: string[] = []
            
            organizations.forEach(org => {
              if (org.acnc_operating_countries && typeof org.acnc_operating_countries === 'string' && org.acnc_operating_countries.trim()) {
                rawCountryData.push(org.acnc_operating_countries)
                // Parse country codes and convert to full country names
                const countryNames = parseOperatingCountries(org.acnc_operating_countries)
                countryNames.forEach(countryName => {
                  operatingCountrySet.add(countryName)
                })
              }
            })
            
            const operatingCountries = Array.from(operatingCountrySet).sort()
            console.log('ACNC operating countries extraction:')
            console.log('- Organizations with operating countries data:', organizations.length)
            console.log('- Unique raw country strings found:', new Set(rawCountryData).size)
            console.log('- Sample raw data:', Array.from(new Set(rawCountryData)).slice(0, 5))
            console.log('- Final operating countries:', operatingCountries.length, operatingCountries.slice(0, 10))
            
            // Debug: Show count of organizations per country for verification
            console.log('- Countries with most organizations:', 
              operatingCountries.slice(0, 5).map(country => {
                const count = rawCountryData.filter(data => {
                  const countryNames = parseOperatingCountries(data)
                  return countryNames.includes(country)
                }).length
                return `${country}(${count})`
              }).join(', ')
            )
            
            setAcncOperatingCountries(operatingCountries)
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

  // Initialize JustGiving data (countries, cities)
  useEffect(() => {
    if (platform === 'justgiving') {
      const loadJustgivingData = async () => {
        try {
          const supabase = createClient()
          
          console.log('Loading JustGiving filter data...')
          
          // Get all JustGiving organizations for comprehensive filter data
          const { data: organizations, error } = await supabase
            .from('organization_cache')
            .select('address_country, address_city')
            .eq('platform', 'justgiving')
            .eq('is_active', true)
            .not('address_country', 'is', null)
            .not('address_city', 'is', null)

          if (error) {
            console.error('Error loading JustGiving data:', error)
            return
          }

          console.log('JustGiving organizations loaded for filters:', organizations?.length)

          if (organizations && organizations.length > 0) {
            // Extract countries
            const countries = Array.from(new Set(organizations.map(o => o.address_country).filter(Boolean))).sort()
            console.log('JustGiving countries found:', countries.length, countries)
            setJustgivingCountries(countries)

            // Extract all cities
            const allCities = Array.from(new Set(organizations.map(o => o.address_city).filter(Boolean))).sort()
            console.log('JustGiving cities found:', allCities.length, allCities.slice(0, 10))
            setJustgivingCities(allCities)
          } else {
            console.log('No JustGiving organizations found for filtering')
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

  // Load cities for selected country (JustGiving)
  useEffect(() => {
    if (platform === 'justgiving' && countryFilter && countryFilter !== 'all') {
      const loadCountryCities = async () => {
        try {
          const supabase = createClient()
          
          console.log('Loading cities for country:', countryFilter)
          
          // Get organizations in the selected country
          const { data: organizations, error } = await supabase
            .from('organization_cache')
            .select('address_city')
            .eq('platform', 'justgiving')
            .eq('is_active', true)
            .eq('address_country', countryFilter)
            .not('address_city', 'is', null)

          if (error) {
            console.error('Error loading country cities:', error)
            return
          }

          if (organizations && organizations.length > 0) {
            const cities = Array.from(new Set(organizations.map(o => o.address_city).filter(Boolean))).sort()
            console.log(`Cities found for ${countryFilter}:`, cities.length, cities.slice(0, 5))
            setCountryCities(cities)
          } else {
            console.log(`No cities found for ${countryFilter}`)
            setCountryCities([])
          }
        } catch (error) {
          console.error('Failed to load country cities:', error)
          setCountryCities([])
        }
      }
      
      loadCountryCities()
    } else {
      // No country selected, clear country cities
      setCountryCities([])
    }
  }, [platform, countryFilter])

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

  // Handle ACNC operating country selection
  const handleOperatingCountrySelect = (country: string) => {
    const url = new URL(window.location.href)
    if (country === selectedOperatingCountry) {
      url.searchParams.delete('operating_country')
      setSelectedOperatingCountry('')
    } else {
      url.searchParams.set('operating_country', country)
      setSelectedOperatingCountry(country)
    }
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

  // Handle JustGiving country selection
  const handleCountrySelect = (country: string) => {
    const url = new URL(window.location.href)
    if (country === selectedCountry) {
      url.searchParams.delete('country')
      setSelectedCountry('')
    } else {
      url.searchParams.set('country', country)
      setSelectedCountry(country)
    }
    // Clear city filter when country changes
    url.searchParams.delete('city')
    url.searchParams.delete('page')
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
    } else if (platform === 'justgiving') {
      // Use country-specific cities if a country is selected, otherwise use all cities
      let cities = (countryFilter && countryFilter !== 'all') ? countryCities : justgivingCities
      
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
    }
    
    return []
  }, [platform, acncCities, stateCities, stateFilter, justgivingCities, countryCities, countryFilter, locationSearch, showAllLocations, cityFilter])

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
        
        if (countryFilter && countryFilter !== 'all') {
          params.set('country', countryFilter)
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

        if (operatingCountryFilter) {
          params.set('operating_country', operatingCountryFilter)
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
  }, [platform, currentPage, searchQuery, categoryFilter, cityFilter, countryFilter, stateFilter, operatingCountryFilter, featuredOnly, preferredOnly, purposeFilter, beneficiaryFilter])

  // Calculate pagination info
  const totalPages = Math.ceil(state.totalCount / ITEMS_PER_PAGE)
  const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, state.totalCount)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.relative')) {
        setCategoryDropdownOpen(false)
        setStateDropdownOpen(false)
        setPurposeDropdownOpen(false)
        setLocationDropdownOpen(false)
        setBeneficiaryDropdownOpen(false)
        setOperatingCountryDropdownOpen(false)
        setJustgivingCountryDropdownOpen(false)
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
    <div className="min-h-screen bg-gray-50">
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
          </div>

          {/* Search Bar and Platform Filters Row */}
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
              
              {/* Inline Country Filter */}
              {justgivingCountries.length > 0 && (
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <div className="relative">
                    <button
                      onClick={() => setJustgivingCountryDropdownOpen(!justgivingCountryDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
                    >
                      <span className={countryFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {countryFilter === 'no_country' ? 'No Country Listed' : countryFilter || 'Select country...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {justgivingCountryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {countryFilter && (
                          <button
                            onClick={() => {
                              handleCountrySelect('')
                              setJustgivingCountryDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear selection
                          </button>
                        )}
                        <button
                          onClick={() => {
                            handleCountrySelect('no_country')
                            setJustgivingCountryDropdownOpen(false)
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                            countryFilter === 'no_country' ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                          }`}
                        >
                          No Country Listed
                        </button>
                        {justgivingCountries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              handleCountrySelect(country)
                              setJustgivingCountryDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                              countryFilter === country ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Inline City Filter */}
              {justgivingCities.length > 0 && (
                <div className="w-full lg:w-64">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location{countryFilter && countryFilter !== 'all' && countryFilter !== 'no_country' ? ` (${countryFilter})` : ''}
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setJustgivingCityDropdownOpen(!justgivingCityDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
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
                              className="w-full pl-7 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
                          {filteredCities.slice(0, 50).map((city) => (
                            <button
                              key={city}
                              onClick={() => {
                                handleJustgivingCitySelect(city)
                                setJustgivingCityDropdownOpen(false)
                                setLocationSearch('')
                              }}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                                cityFilter === city ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                          {filteredCities.length > 50 && (
                            <div className="px-3 py-2 text-xs text-gray-500 border-t">
                              Showing first 50 of {filteredCities.length} locations
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : platform === 'acnc' ? (
            /* ACNC Search and Filters Row */
            <div className="mt-4 flex flex-col xl:flex-row gap-3 items-start xl:items-end">
              {/* Search Bar */}
              <div className="flex-1 max-w-48">
                <div className="relative">
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
              
              {/* Inline Category Filter */}
              {acncCategories.length > 0 && (
                <div className="w-full xl:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <div className="relative">
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
                  <div className="relative">
                    <button
                      onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between"
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
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                              stateFilter === state ? 'bg-blue-100 text-blue-800 font-medium' : 'text-gray-700'
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
                  <div className="relative">
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
                  <div className="relative">
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
                            className="w-full px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 border-t bg-white"
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
                  <div className="relative">
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
              
              {/* Inline Operating Countries Filter */}
              {acncOperatingCountries.length > 0 && (
                <div className="w-full xl:w-48">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operating Countries</label>
                  <div className="relative">
                    <button
                      onClick={() => setOperatingCountryDropdownOpen(!operatingCountryDropdownOpen)}
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-left text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 flex items-center justify-between"
                    >
                      <span className={operatingCountryFilter ? 'text-gray-900' : 'text-gray-500'}>
                        {operatingCountryFilter || 'Countries...'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </button>
                    
                    {operatingCountryDropdownOpen && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {operatingCountryFilter && (
                          <button
                            onClick={() => {
                              handleOperatingCountrySelect('')
                              setOperatingCountryDropdownOpen(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-50 border-b"
                          >
                            Clear selection
                          </button>
                        )}
                        {acncOperatingCountries.map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              handleOperatingCountrySelect(country)
                              setOperatingCountryDropdownOpen(false)
                            }}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                              operatingCountryFilter === country ? 'bg-indigo-100 text-indigo-800 font-medium' : 'text-gray-700'
                            }`}
                          >
                            {country}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Default Search Bar for other platforms */
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
          )}

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

          {/* Every.org State Selection - REMOVED (no structured location data) */}

          {/* Every.org Location Selection - REMOVED (no structured location data) */}
          {platform === 'everyorg' && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-yellow-800">Location Filtering</h3>
                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">Note</span>
              </div>
              <p className="text-sm text-yellow-700">
                Every.org organizations contain location information in their descriptions, but not in structured address fields. 
                Use the search bar above to find organizations by location (e.g., "San Francisco", "Texas", "California").
              </p>
            </div>
          )}

          {/* JustGiving filters moved to inline row above */}

          {/* ACNC filters moved to inline row above */}

          {/* Results Content */}
        <div className="mt-8">
          {/* Filter Summary */}
          {(categoryFilter || cityFilter || countryFilter || stateFilter || operatingCountryFilter || searchQuery || purposeFilter || featuredOnly || preferredOnly) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Active Filters:</h3>
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Search: "{searchQuery}"
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
                    Category: {categoryFilter}
                  </span>
                )}
                {stateFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    State: {stateFilter}
                  </span>
                )}
                {purposeFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                    Purpose: {purposeFilter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
                {countryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Country: {countryFilter === 'no_country' ? 'No Country Listed' : countryFilter}
                  </span>
                )}
                {operatingCountryFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                    Operating Country: {operatingCountryFilter}
                  </span>
                )}
                {cityFilter && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-sky-100 text-sky-800">
                    Location: {cityFilter}
                  </span>
                )}
                {featuredOnly && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                    Featured Only
                  </span>
                )}
                {preferredOnly && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-pink-100 text-pink-800">
                    Preferred by Services
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

        {/* Filters Sidebar - Hidden for ACNC (uses top filters instead) */}
        {showFilters && platform !== 'acnc' && (
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
    </div>
  )
}

