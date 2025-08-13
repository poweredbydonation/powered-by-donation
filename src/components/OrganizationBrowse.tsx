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
    featured?: string
    preferred?: string
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
  const featuredOnly = searchParams.featured === 'true'
  const preferredOnly = searchParams.preferred === 'true'

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
    }
  }

  const config = platformConfig[platform]

  // Load organizations
  useEffect(() => {
    async function loadOrganizations() {
      setState(prev => ({ ...prev, loading: true, error: null }))
      
      try {
        const supabase = createClient()
        let query = supabase
          .from('organization_cache')
          .select('*', { count: 'exact' })
          .eq('platform', platform)
          .eq('is_active', true)

        // Apply filters
        if (searchQuery) {
          query = query.textSearch('fts', searchQuery, { type: 'websearch' })
        }

        if (categoryFilter) {
          query = query.eq('category', categoryFilter)
        }

        if (cityFilter) {
          query = query.eq('address_city', cityFilter)
        }

        if (featuredOnly) {
          query = query.eq('is_featured', true)
        }

        // Preferred organizations filter (organizations with active services)
        if (preferredOnly) {
          const { data: preferredIds } = await supabase
            .from('services')
            .select('organization_id')
            .eq('platform', platform)
            .eq('is_active', true)
            .not('organization_id', 'is', null)

          if (preferredIds && preferredIds.length > 0) {
            const ids = Array.from(new Set(preferredIds.map(s => s.organization_id)))
            query = query.in('external_id', ids)
          } else {
            // No preferred organizations found
            setState(prev => ({
              ...prev,
              organizations: [],
              totalCount: 0,
              hasMore: false,
              loading: false
            }))
            return
          }
        }

        // Pagination
        const offset = (currentPage - 1) * ITEMS_PER_PAGE
        query = query
          .order('is_featured', { ascending: false })
          .order('total_donations_count', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1)

        const { data, error, count } = await query

        if (error) throw error

        setState({
          organizations: data || [],
          totalCount: count || 0,
          hasMore: (count || 0) > offset + ITEMS_PER_PAGE,
          loading: false,
          error: null
        })

      } catch (error) {
        console.error('Error loading organizations:', error)
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load organizations'
        }))
      }
    }

    loadOrganizations()
  }, [platform, currentPage, searchQuery, categoryFilter, cityFilter, featuredOnly, preferredOnly])

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
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="w-64 flex-shrink-0">
              <OrganizationFilters
                platform={platform}
                entityType={entityType}
                currentFilters={{
                  category: categoryFilter,
                  city: cityFilter,
                  featured: featuredOnly,
                  preferred: preferredOnly
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