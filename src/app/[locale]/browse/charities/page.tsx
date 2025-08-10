'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import CharityCard from '@/components/CharityCard'
import { Search, Heart, Users, TrendingUp, MapPin, Globe, Shield, Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JustGivingCharityCache } from '@/types/database'

interface BrowseCharitiesPageProps {
  params: {
    locale: string
  }
}

interface CharityFilters {
  search: string
  category: string
  country: string
  status: string
  enhancedData: string
}

interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  pageSize: number
}

const PAGE_SIZE = 24 // Show 24 charities per page (fits nicely in 3x8 grid)

export default function BrowseCharitiesPage({ params }: BrowseCharitiesPageProps) {
  const locale = params.locale
  const [charities, setCharities] = useState<JustGivingCharityCache[]>([])
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [messages, setMessages] = useState<any>({})
  
  // Filter state
  const [filters, setFilters] = useState<CharityFilters>({
    search: '',
    category: 'all',
    country: 'all',
    status: 'all',
    enhancedData: 'all'
  })
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: PAGE_SIZE
  })
  
  // Filter options
  const [categories, setCategories] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [stats, setStats] = useState({
    totalCharities: 0,
    totalDonations: 0,
    totalAmount: 0,
    charitiesWithDonations: 0,
    enhancedCharities: 0,
    approvedCharities: 0,
    registeredCharities: 0,
    countriesCount: 0
  })

  useEffect(() => {
    // Load messages
    async function loadMessages() {
      try {
        const msgs = (await import(`../../../../messages/${locale}.json`)).default
        setMessages(msgs)
      } catch (error) {
        // Fallback to English
        const msgs = (await import(`../../../../messages/en.json`)).default
        setMessages(msgs)
      }
    }

    // Load filter options and stats once on mount
    async function loadFiltersAndStats() {
      const supabase = createClient()
      
      try {
        // Load categories (distinct values)
        const { data: categoryData } = await supabase
          .from('justgiving_charity_cache')
          .select('category')
          .not('category', 'is', null)
          .not('category', 'eq', '')
        
        const uniqueCategories = Array.from(
          new Set(categoryData?.map(item => item.category).filter(Boolean))
        ).sort()
        setCategories(uniqueCategories)

        // Load countries (distinct values)
        const { data: countryData } = await supabase
          .from('justgiving_charity_cache')
          .select('address_country, country_code')
          .or('address_country.not.is.null,country_code.not.is.null')
        
        const uniqueCountries = Array.from(
          new Set([
            ...countryData?.map(item => item.address_country).filter(Boolean) || [],
            ...countryData?.map(item => item.country_code).filter(Boolean) || []
          ])
        ).sort()
        setCountries(uniqueCountries)

        // Load stats
        const { data: statsData } = await supabase
          .from('justgiving_charity_cache')
          .select(`
            total_donations_count,
            total_amount_received,
            enhanced_data_fetched_at,
            is_approved,
            registration_number,
            address_country,
            country_code
          `)

        if (statsData) {
          setStats({
            totalCharities: statsData.length,
            totalDonations: statsData.reduce((sum, charity) => sum + (charity.total_donations_count || 0), 0),
            totalAmount: statsData.reduce((sum, charity) => sum + (charity.total_amount_received || 0), 0),
            charitiesWithDonations: statsData.filter(charity => (charity.total_donations_count || 0) > 0).length,
            enhancedCharities: statsData.filter(charity => charity.enhanced_data_fetched_at !== null).length,
            approvedCharities: statsData.filter(charity => charity.is_approved === true).length,
            registeredCharities: statsData.filter(charity => 
              charity.registration_number && 
              charity.registration_number.trim() !== '' &&
              !charity.registration_number.toLowerCase().includes('n/a')
            ).length,
            countriesCount: uniqueCountries.length
          })
        }
      } catch (error) {
        console.error('Error loading filters and stats:', error)
      }
    }

    loadMessages()
    loadFiltersAndStats()
  }, [locale])

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchTerm: string, filterValues: CharityFilters) => {
      setFilters(prev => ({ ...prev, search: searchTerm }))
      setPagination(prev => ({ ...prev, currentPage: 1 })) // Reset to first page
    }, 300),
    []
  )

  // Fetch charities with server-side filtering and pagination
  const fetchCharities = useCallback(async (currentFilters: CharityFilters, page: number) => {
    const supabase = createClient()
    setSearchLoading(true)
    
    try {
      let query = supabase
        .from('justgiving_charity_cache')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })

      // Apply search filter (server-side text search)
      if (currentFilters.search.trim()) {
        const searchTerm = currentFilters.search.trim()
        // Use ilike for partial matches as a fallback to FTS
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%,address_city.ilike.%${searchTerm}%,registration_number.ilike.%${searchTerm}%`)
      }

      // Apply category filter
      if (currentFilters.category !== 'all') {
        query = query.eq('category', currentFilters.category)
      }

      // Apply country filter
      if (currentFilters.country !== 'all') {
        query = query.or(`address_country.eq.${currentFilters.country},country_code.eq.${currentFilters.country}`)
      }

      // Apply status filter
      if (currentFilters.status === 'approved') {
        query = query.eq('is_approved', true)
      } else if (currentFilters.status === 'registered') {
        query = query.not('registration_number', 'is', null)
          .not('registration_number', 'eq', '')
          .not('registration_number', 'ilike', '%n/a%')
      }

      // Apply enhanced data filter
      if (currentFilters.enhancedData === 'enhanced') {
        query = query.not('enhanced_data_fetched_at', 'is', null)
      } else if (currentFilters.enhancedData === 'basic') {
        query = query.is('enhanced_data_fetched_at', null)
      }

      // Apply pagination
      const from = (page - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) {
        console.error('Error fetching charities:', error)
        return
      }

      setCharities(data || [])
      setPagination(prev => ({
        ...prev,
        currentPage: page,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / PAGE_SIZE)
      }))

    } catch (error) {
      console.error('Error in fetchCharities:', error)
    } finally {
      setSearchLoading(false)
      setLoading(false)
    }
  }, [])

  // Effect to fetch charities when filters or page changes
  useEffect(() => {
    fetchCharities(filters, pagination.currentPage)
  }, [filters, pagination.currentPage, fetchCharities])

  // Handle filter changes
  const handleFilterChange = (key: keyof CharityFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, currentPage: 1 })) // Reset to first page
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    debouncedSearch(value, filters)
  }

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, currentPage: newPage }))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      country: 'all',
      status: 'all',
      enhancedData: 'all'
    })
    setPagination(prev => ({ ...prev, currentPage: 1 }))
  }

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => (
    filters.search.trim() !== '' ||
    filters.category !== 'all' ||
    filters.country !== 'all' ||
    filters.status !== 'all' ||
    filters.enhancedData !== 'all'
  ), [filters])

  // Generate pagination buttons
  const paginationButtons = useMemo(() => {
    const buttons = []
    const { currentPage, totalPages } = pagination
    
    // Always show first page
    if (totalPages > 1) buttons.push(1)
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 2); i <= Math.min(totalPages - 1, currentPage + 2); i++) {
      if (i > 1) buttons.push(i)
    }
    
    // Always show last page
    if (totalPages > 1 && !buttons.includes(totalPages)) buttons.push(totalPages)
    
    return buttons
  }, [pagination])

  return (
    <div className="min-h-screen bg-white">
      <MultilingualNavbar locale={locale} messages={messages} />
      
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Browse Charities
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              Discover registered charities from JustGiving that you can support through our service marketplace. 
              Find causes you care about and see which services benefit each charity.
            </p>
            <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {stats.totalCharities.toLocaleString()} charities
              </span>
              <span className="flex items-center">
                <Globe className="h-4 w-4 mr-1" />
                {stats.countriesCount} countries
              </span>
              <span className="flex items-center">
                <Star className="h-4 w-4 mr-1" />
                {stats.enhancedCharities.toLocaleString()} enhanced
              </span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                defaultValue={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name, description, location, registration number..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories ({categories.length})</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-1 text-blue-500" />
                  Country
                </label>
                <select
                  value={filters.country}
                  onChange={(e) => handleFilterChange('country', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Countries ({countries.length})</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-green-500" />
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="approved">JustGiving Approved ({stats.approvedCharities})</option>
                  <option value="registered">Officially Registered ({stats.registeredCharities})</option>
                </select>
              </div>

              {/* Enhanced Data Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                  Detail Level
                </label>
                <select
                  value={filters.enhancedData}
                  onChange={(e) => handleFilterChange('enhancedData', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Details</option>
                  <option value="enhanced">Enhanced Details ({stats.enhancedCharities})</option>
                  <option value="basic">Basic Info Only ({stats.totalCharities - stats.enhancedCharities})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Summary and Results Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-900">
                {searchLoading ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
                    Searching...
                  </span>
                ) : (
                  <>
                    Showing {((pagination.currentPage - 1) * PAGE_SIZE) + 1}-{Math.min(pagination.currentPage * PAGE_SIZE, pagination.totalCount)} of {pagination.totalCount.toLocaleString()} charities
                  </>
                )}
              </span>
              
              {/* Active filters display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap items-center gap-2">
                  {filters.search.trim() && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Search: "{filters.search}"
                    </span>
                  )}
                  {filters.category !== 'all' && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Category: {filters.category}
                    </span>
                  )}
                  {filters.country !== 'all' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Country: {filters.country}
                    </span>
                  )}
                  {filters.status !== 'all' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Status: {filters.status === 'approved' ? 'JustGiving Approved' : 'Registered'}
                    </span>
                  )}
                  {filters.enhancedData !== 'all' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Details: {filters.enhancedData === 'enhanced' ? 'Enhanced' : 'Basic'}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          {/* Charities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading charities...</p>
              </div>
            ) : charities.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Heart className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No matching charities found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filters to find more charities.
                </p>
              </div>
            ) : (
              charities.map((charity) => (
                <CharityCard 
                  key={charity.justgiving_charity_id} 
                  charity={charity}
                  locale={locale}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mb-8">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
              {paginationButtons.map((pageNum, index, array) => (
                <div key={pageNum} className="flex items-center">
                  {index > 0 && array[index - 1] !== pageNum - 1 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      pageNum === pagination.currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                </div>
              ))}
              
              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Community Impact Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Community Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{pagination.totalCount.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  {hasActiveFilters ? 'Matching Charities' : 'Total Charities'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.charitiesWithDonations.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  Charities Supported
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{stats.totalDonations.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  Service Donations
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">£{stats.totalAmount.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  Total Donated
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              All donations go directly to registered charities via JustGiving
            </p>
          </div>

          {/* Call to Action for Donors */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Want to support a charity?
            </h3>
            <p className="text-gray-600 mb-6">
              Browse our services and make a donation to your chosen charity while receiving professional help.
            </p>
            <a 
              href={`/${locale}/browse`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              Browse Services
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}