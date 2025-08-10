'use client'

import { useState, useEffect } from 'react'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import CharityCard from '@/components/CharityCard'
import { Search, Heart, Users, TrendingUp, MapPin, Globe, Shield, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { JustGivingCharityCache } from '@/types/database'

interface BrowseCharitiesPageProps {
  params: {
    locale: string
  }
}

export default function BrowseCharitiesPage({ params }: BrowseCharitiesPageProps) {
  const locale = params.locale
  const [charities, setCharities] = useState<JustGivingCharityCache[]>([])
  const [filteredCharities, setFilteredCharities] = useState<JustGivingCharityCache[]>([])
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<any>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [hasEnhancedData, setHasEnhancedData] = useState<string>('all')

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

    // Fetch charities with pagination to get all records
    async function fetchCharities() {
      const supabase = createClient()
      
      let allCharities: JustGivingCharityCache[] = []
      let from = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('justgiving_charity_cache')
          .select('*')
          .range(from, from + pageSize - 1)
          .order('name', { ascending: true })

        if (error) {
          console.error('Error fetching charities:', error)
          break
        }

        const batch = data || []
        allCharities = [...allCharities, ...batch]
        
        // Check if we got fewer records than requested (end of data)
        hasMore = batch.length === pageSize
        from += pageSize
        
        // Log progress for large datasets
        if (allCharities.length % 1000 === 0 || !hasMore) {
          console.log(`Loaded ${allCharities.length} of ~1745 charities`)
        }
      }
      setCharities(allCharities)
      setFilteredCharities(allCharities)
        
      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(
          allCharities
            .map(charity => charity.category)
            .filter((category): category is string => category !== undefined && category !== null && category.trim() !== '')
        )
      ).sort()
      setCategories(uniqueCategories)

      // Extract unique countries from enhanced data
      const uniqueCountries = Array.from(
        new Set(
          allCharities
            .map(charity => charity.address_country || charity.country_code)
            .filter((country): country is string => country !== undefined && country !== null && country.trim() !== '')
        )
      ).sort()
      setCountries(uniqueCountries)
      
      setLoading(false)
    }

    loadMessages()
    fetchCharities()
  }, [locale])

  // Filter charities based on search query and filters
  useEffect(() => {
    let filtered = charities

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const beforeFilter = filtered.length
      filtered = filtered.filter(
        charity =>
          charity.name.toLowerCase().includes(query) ||
          charity.description?.toLowerCase().includes(query) ||
          charity.category?.toLowerCase().includes(query) ||
          charity.keywords?.toLowerCase().includes(query) ||
          charity.address_city?.toLowerCase().includes(query) ||
          charity.registration_number?.toLowerCase().includes(query)
      )
      // Log search results for debugging
      console.log(`Search "${query}": ${beforeFilter} -> ${filtered.length} results`)
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(charity => charity.category === selectedCategory)
    }

    // Apply country filter
    if (selectedCountry !== 'all') {
      filtered = filtered.filter(charity => 
        charity.address_country === selectedCountry || 
        charity.country_code === selectedCountry
      )
    }

    // Apply status filter
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'approved') {
        filtered = filtered.filter(charity => charity.is_approved === true)
      } else if (selectedStatus === 'registered') {
        filtered = filtered.filter(charity => 
          charity.registration_number && 
          charity.registration_number.trim() !== '' &&
          !charity.registration_number.toLowerCase().includes('n/a')
        )
      }
    }

    // Apply enhanced data filter
    if (hasEnhancedData !== 'all') {
      if (hasEnhancedData === 'enhanced') {
        filtered = filtered.filter(charity => charity.enhanced_data_fetched_at !== null)
      } else if (hasEnhancedData === 'basic') {
        filtered = filtered.filter(charity => charity.enhanced_data_fetched_at === null)
      }
    }

    setFilteredCharities(filtered)
  }, [charities, searchQuery, selectedCategory, selectedCountry, selectedStatus, hasEnhancedData])

  // Calculate stats
  const totalCharities = charities.length
  const totalDonations = charities.reduce((sum, charity) => sum + (charity.total_donations_count || 0), 0)
  const totalAmount = charities.reduce((sum, charity) => sum + (charity.total_amount_received || 0), 0)
  const charitiesWithDonations = charities.filter(charity => (charity.total_donations_count || 0) > 0).length
  const enhancedCharities = charities.filter(charity => charity.enhanced_data_fetched_at !== null).length
  const approvedCharities = charities.filter(charity => charity.is_approved === true).length
  const registeredCharities = charities.filter(charity => 
    charity.registration_number && 
    charity.registration_number.trim() !== '' &&
    !charity.registration_number.toLowerCase().includes('n/a')
  ).length

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
              Discover registered charities from JustGiving that you can support through our service marketplace. Find causes you care about and see which services benefit each charity.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, description, location, registration number..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Heart className="h-4 w-4 mr-1 text-red-500" />
                  Category
                </label>
                <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Country Filter */}
              <div>
                <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Globe className="h-4 w-4 mr-1 text-blue-500" />
                  Country
                </label>
                <select
                  id="country-select"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-green-500" />
                  Status
                </label>
                <select
                  id="status-select"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="approved">JustGiving Approved</option>
                  <option value="registered">Officially Registered</option>
                </select>
              </div>

              {/* Enhanced Data Filter */}
              <div>
                <label htmlFor="enhanced-select" className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-purple-500" />
                  Detail Level
                </label>
                <select
                  id="enhanced-select"
                  value={hasEnhancedData}
                  onChange={(e) => setHasEnhancedData(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Details</option>
                  <option value="enhanced">Enhanced Details</option>
                  <option value="basic">Basic Info Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(selectedCategory !== 'all' || selectedCountry !== 'all' || selectedStatus !== 'all' || hasEnhancedData !== 'all' || searchQuery.trim()) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-blue-900">
                    Showing {filteredCharities.length} of {totalCharities} charities
                  </span>
                  {searchQuery.trim() && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Search: "{searchQuery}"
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      Category: {selectedCategory}
                    </span>
                  )}
                  {selectedCountry !== 'all' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Country: {selectedCountry}
                    </span>
                  )}
                  {selectedStatus !== 'all' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      Status: {selectedStatus === 'approved' ? 'JustGiving Approved' : 'Registered'}
                    </span>
                  )}
                  {hasEnhancedData !== 'all' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      Details: {hasEnhancedData === 'enhanced' ? 'Enhanced' : 'Basic'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                    setSelectedCountry('all')
                    setSelectedStatus('all')
                    setHasEnhancedData('all')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}

          {/* Charities Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {loading ? (
              <div className="col-span-full text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading charities...</p>
              </div>
            ) : filteredCharities.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Heart className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {charities.length === 0 ? 'No charities available' : 'No matching charities'}
                </h3>
                <p className="text-gray-500">
                  {charities.length === 0 
                    ? 'Charity data is being populated. Please check back soon!'
                    : 'Try adjusting your search or category filters to find more charities.'
                  }
                </p>
              </div>
            ) : (
              filteredCharities.map((charity) => (
                <CharityCard 
                  key={charity.justgiving_charity_id} 
                  charity={charity}
                  locale={locale}
                />
              ))
            )}
          </div>

          {/* Community Impact Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Community Impact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{filteredCharities.length}</div>
                <div className="text-sm text-gray-500">
                  {selectedCategory === 'all' && !searchQuery.trim()
                    ? 'Total Charities'
                    : 'Matching Charities'
                  }
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{charitiesWithDonations}</div>
                <div className="text-sm text-gray-500">
                  Charities Supported
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{totalDonations}</div>
                <div className="text-sm text-gray-500">
                  Service Donations
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">£{totalAmount.toLocaleString()}</div>
                <div className="text-sm text-gray-500">
                  Total Donated
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              All donations go directly to registered charities via JustGiving
            </p>
          </div>

          {/* Database Enhancement Stats */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Star className="h-5 w-5 mr-2 text-amber-500" />
              Enhanced Database Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xl font-bold text-amber-600">{enhancedCharities}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  <Star className="h-3 w-3 mr-1" />
                  Enhanced Details
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xl font-bold text-green-600">{approvedCharities}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  <Shield className="h-3 w-3 mr-1" />
                  JustGiving Approved
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xl font-bold text-purple-600">{registeredCharities}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  <Globe className="h-3 w-3 mr-1" />
                  Officially Registered
                </div>
              </div>
              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                <div className="text-xl font-bold text-blue-600">{countries.length}</div>
                <div className="text-sm text-gray-600 flex items-center justify-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  Countries Represented
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              Enhanced details include addresses, contact information, and impact statements
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