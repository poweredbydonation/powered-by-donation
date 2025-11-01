/**
 * Platform Home Component
 * Displays platform-specific landing page with featured organizations and stats
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { buildPlatformUrl } from '@/lib/utils/entity-urls'
import { ExternalLink, TrendingUp, Users, Calendar, Search } from 'lucide-react'

interface PlatformHomeProps {
  locale: string
  platform: DonationPlatform
  messages?: any
}

interface PlatformStats {
  total_organizations: number
  total_services: number
  this_month_donations: number
  featured_organizations: OrganizationCache[]
}

export default function PlatformHome({ locale, platform, messages }: PlatformHomeProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<OrganizationCache[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [allOrganizations, setAllOrganizations] = useState<OrganizationCache[]>([])
  const [allOrgsLoading, setAllOrgsLoading] = useState(true)

  const platformConfig = {
    justgiving: {
      name: 'JustGiving',
      description: 'UK\'s leading charity fundraising platform',
      color: 'blue',
      bgClass: 'bg-blue-50',
      borderClass: 'border-blue-200',
      textClass: 'text-blue-800',
      buttonClass: 'bg-blue-600 hover:bg-blue-700'
    },
    everyorg: {
      name: 'Every.org',
      description: 'Global nonprofit donation platform',
      color: 'green',
      bgClass: 'bg-green-50',
      borderClass: 'border-green-200', 
      textClass: 'text-green-800',
      buttonClass: 'bg-green-600 hover:bg-green-700'
    },
    acnc: {
      name: 'ACNC',
      description: 'Australian Charities and Not-for-profits Commission',
      color: 'orange',
      bgClass: 'bg-orange-50',
      borderClass: 'border-orange-200',
      textClass: 'text-orange-800',
      buttonClass: 'bg-orange-600 hover:bg-orange-700'
    }
  }

  const config = platformConfig[platform]

  // Search function for organizations
  const searchOrganizations = async (query: string) => {
    if (!query.trim() || query.length < 1) {
      setSearchResults([])
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('organization_cache')
        .select('*')
        .eq('platform', platform)
        .eq('show_on_platform', true)
        .or(`name.ilike.%${query}%,display_name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name', { ascending: true })
        .limit(100)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Error searching organizations:', error)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Load all organizations for initial display
  const loadAllOrganizations = async () => {
    if (platform !== 'justgiving') return
    
    setAllOrgsLoading(true)
    const supabase = createClient()
    
    try {
      const { data, error } = await supabase
        .from('organization_cache')
        .select('*')
        .eq('platform', platform)
        .eq('show_on_platform', true)
        .order('name', { ascending: true })
        .limit(50) // Show first 50 organizations

      if (error) throw error
      setAllOrganizations(data || [])
    } catch (error) {
      console.error('Error loading all organizations:', error)
      setAllOrganizations([])
    } finally {
      setAllOrgsLoading(false)
    }
  }

  // Debounced search effect - faster response
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchOrganizations(searchQuery)
    }, 150)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, platform])

  useEffect(() => {
    async function loadPlatformStats() {
      const supabase = createClient()
      
      try {
        // Get platform statistics - handle ACNC differently
        const [orgCount, serviceCount, monthlyDonations, featuredOrgs] = await Promise.all([
          // Total organizations count
          supabase
            .from('organization_cache')
            .select('*', { count: 'exact', head: true })
            .eq('platform', platform)
            .eq('show_on_platform', true),
          
          // Services count for this platform (ACNC doesn't have services)
          platform === 'acnc' 
            ? Promise.resolve({ count: 0 })
            : supabase
                .from('services')
                .select('*', { count: 'exact', head: true })
                .eq('platform', platform)
                .eq('is_active', true),
          
          // Monthly donations count (ACNC doesn't have direct donations)
          platform === 'acnc'
            ? Promise.resolve({ count: 0 })
            : supabase
                .from('service_requests')
                .select('*', { count: 'exact', head: true })
                .eq('platform', platform)
                .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          
          // Featured organizations (ACNC doesn't have featured flag, get top by name)
          platform === 'acnc'
            ? supabase
                .from('organization_cache')
                .select('*')
                .eq('platform', platform)
                .eq('show_on_platform', true)
                .not('description', 'is', null)
                .not('description', 'eq', '')
                .order('name', { ascending: true })
                .limit(6)
            : supabase
                .from('organization_cache')
                .select('*')
                .eq('platform', platform)
                .eq('show_on_platform', true)
                .eq('is_featured', true)
                .order('total_donations_count', { ascending: false })
                .limit(6)
        ])

        setStats({
          total_organizations: orgCount.count || 0,
          total_services: serviceCount.count || 0,
          this_month_donations: monthlyDonations.count || 0,
          featured_organizations: featuredOrgs.data || []
        })

      } catch (error) {
        console.error('Error loading platform stats:', error)
        setStats({
          total_organizations: 0,
          total_services: 0, 
          this_month_donations: 0,
          featured_organizations: []
        })
      } finally {
        setLoading(false)
      }
    }

    loadPlatformStats()
    loadAllOrganizations()
  }, [platform])

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const browseUrl = buildPlatformUrl(locale, platform)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className={`${config.bgClass} border-b ${config.borderClass}`}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            {/* Platform Logo */}
            <div className="mb-6">
              {platform === 'justgiving' && (
                <img
                  src="/justgiving-logo.svg"
                  alt="JustGiving"
                  className="h-12 w-auto mx-auto"
                />
              )}
              {platform === 'everyorg' && (
                <img
                  src="/Logo_Green.svg"
                  alt="Every.org"
                  className="h-12 w-auto mx-auto"
                />
              )}
            </div>
            <h1 className={`text-4xl font-bold ${config.textClass} mb-4`}>
              {config.name}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {config.description}
            </p>
            
            {/* Search interface for JustGiving */}
            {platform === 'justgiving' && (
              <div className="max-w-xl mx-auto mb-8">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 transition-colors ${searchLoading ? 'text-blue-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Start typing to search charities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <Link 
              href={browseUrl}
              className={`inline-flex items-center px-6 py-3 ${config.buttonClass} text-white font-medium rounded-lg hover:shadow-lg transition-all`}
            >
              {platform === 'justgiving' ? 'Browse All Charities' : 'Browse Organizations'}
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Organizations for JustGiving */}
        {platform === 'justgiving' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {searchQuery.trim().length >= 1 
                  ? `Search Results ${searchLoading ? '' : `(${searchResults.length})`}`
                  : `All Charities ${allOrgsLoading ? '' : `(${allOrganizations.length})`}`
                }
              </h2>
              {searchLoading && (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              )}
            </div>
            
            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim().length >= 1 ? (
              // Search results
              searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.map((org) => (
                    <Link
                      key={org.id}
                      href={buildPlatformUrl(locale, platform, org.slug)}
                      className="block bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        {org.logo_url && (
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {org.display_name || org.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {org.description}
                          </p>
                          {org.address_city && (
                            <p className="text-xs text-gray-500 mt-2">
                              {org.address_city}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No charities found</h3>
                  <p className="text-gray-600">Try adjusting your search terms</p>
                </div>
              )
            ) : (
              // All organizations when no search
              allOrgsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-white border rounded-lg p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : allOrganizations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allOrganizations.map((org) => (
                    <Link
                      key={org.id}
                      href={buildPlatformUrl(locale, platform, org.slug)}
                      className="block bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        {org.logo_url && (
                          <img
                            src={org.logo_url}
                            alt={org.name}
                            className="w-12 h-12 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {org.display_name || org.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {org.description}
                          </p>
                          {org.address_city && (
                            <p className="text-xs text-gray-500 mt-2">
                              {org.address_city}
                            </p>
                          )}
                          {(org.total_donations_count || 0) > 0 && (
                            <p className="text-xs text-green-600 mt-2">
                              {org.total_donations_count} donations received
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No charities available</h3>
                  <p className="text-gray-600">Check back later for available charities</p>
                </div>
              )
            )}
          </div>
        )}

        {/* Featured Organizations for non-JustGiving platforms */}
        {platform !== 'justgiving' && stats?.featured_organizations && stats.featured_organizations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Organizations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.featured_organizations.map((org) => (
                <Link
                  key={org.id}
                  href={buildPlatformUrl(locale, platform, org.slug)}
                  className="block bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {org.logo_url && (
                      <img
                        src={org.logo_url}
                        alt={org.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {org.display_name || org.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {org.description}
                      </p>
                      {(org.total_donations_count || 0) > 0 && (
                        <p className="text-xs text-green-600 mt-2">
                          {org.total_donations_count} donations received
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats Section */}
        <div className="mt-12 pt-12 border-t border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Platform Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-lg p-6 text-center">
              <Users className={`h-8 w-8 ${config.textClass} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.total_organizations.toLocaleString()}
              </div>
              <div className="text-gray-600">Organizations</div>
            </div>
            
            <div className="bg-white border rounded-lg p-6 text-center">
              <TrendingUp className={`h-8 w-8 ${config.textClass} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.total_services.toLocaleString()}
              </div>
              <div className="text-gray-600">Active Services</div>
            </div>
            
            <div className="bg-white border rounded-lg p-6 text-center">
              <Calendar className={`h-8 w-8 ${config.textClass} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-gray-900">
                {stats?.this_month_donations.toLocaleString()}
              </div>
              <div className="text-gray-600">Donations This Month</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}