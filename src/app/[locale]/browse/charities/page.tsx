'use client'

import { useState, useEffect } from 'react'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import CharityCard from '@/components/CharityCard'
import { Search, Heart, Users, TrendingUp } from 'lucide-react'
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
  const [categories, setCategories] = useState<string[]>([])

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

    // Fetch charities
    async function fetchCharities() {
      const supabase = createClient()
      
      // Fetch all charities
      const { data, error } = await supabase
        .from('justgiving_charity_cache')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching charities:', error)
        setCharities([])
      } else {
        const charitiesData = data || []
        setCharities(charitiesData)
        setFilteredCharities(charitiesData)
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set(
            charitiesData
              .map(charity => charity.category)
              .filter(category => category && category.trim() !== '')
          )
        ).sort()
        setCategories(uniqueCategories)
      }
      
      setLoading(false)
    }

    loadMessages()
    fetchCharities()
  }, [locale])

  // Filter charities based on search query and category
  useEffect(() => {
    let filtered = charities

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        charity =>
          charity.name.toLowerCase().includes(query) ||
          charity.description?.toLowerCase().includes(query) ||
          charity.category?.toLowerCase().includes(query)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(charity => charity.category === selectedCategory)
    }

    setFilteredCharities(filtered)
  }, [charities, searchQuery, selectedCategory])

  // Calculate stats
  const totalCharities = charities.length
  const totalDonations = charities.reduce((sum, charity) => sum + (charity.total_donations_count || 0), 0)
  const totalAmount = charities.reduce((sum, charity) => sum + (charity.total_amount_received || 0), 0)
  const charitiesWithDonations = charities.filter(charity => (charity.total_donations_count || 0) > 0).length

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
                placeholder="Search charities by name, description, or category..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div>
              <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
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
          </div>

          {/* Filter Summary */}
          {(selectedCategory !== 'all' || searchQuery.trim()) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-blue-900">
                    Showing {filteredCharities.length} of {totalCharities} charities
                  </span>
                  {searchQuery.trim() && (
                    <span className="text-sm text-blue-700">
                      matching "{searchQuery}"
                    </span>
                  )}
                  {selectedCategory !== 'all' && (
                    <span className="text-sm text-blue-700">
                      in "{selectedCategory}"
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('all')
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear filters
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
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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