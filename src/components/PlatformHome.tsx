/**
 * Platform Home Component
 * Displays platform-specific landing page with featured organizations and stats
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DonationPlatform, OrganizationCache } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { buildPlatformUrl } from '@/lib/utils/entity-urls'
import { ExternalLink, TrendingUp, Users, Calendar } from 'lucide-react'

interface PlatformHomeProps {
  locale: string
  platform: DonationPlatform
}

interface PlatformStats {
  total_organizations: number
  total_services: number
  this_month_donations: number
  featured_organizations: OrganizationCache[]
}

export default function PlatformHome({ locale, platform }: PlatformHomeProps) {
  const t = useTranslations('platform')
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [loading, setLoading] = useState(true)

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
    }
  }

  const config = platformConfig[platform]

  useEffect(() => {
    async function loadPlatformStats() {
      const supabase = createClient()
      
      try {
        // Get platform statistics
        const [orgCount, serviceCount, monthlyDonations, featuredOrgs] = await Promise.all([
          // Total organizations count
          supabase
            .from('organization_cache')
            .select('*', { count: 'exact', head: true })
            .eq('platform', platform)
            .eq('is_active', true),
          
          // Services count for this platform  
          supabase
            .from('services')
            .select('*', { count: 'exact', head: true })
            .eq('platform', platform)
            .eq('is_active', true),
          
          // Monthly donations count
          supabase
            .from('service_requests')
            .select('*', { count: 'exact', head: true })
            .eq('platform', platform)
            .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
          
          // Featured organizations
          supabase
            .from('organization_cache')
            .select('*')
            .eq('platform', platform)
            .eq('is_active', true)
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
            <h1 className={`text-4xl font-bold ${config.textClass} mb-4`}>
              {config.name}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              {config.description}
            </p>
            <Link 
              href={browseUrl}
              className={`inline-flex items-center px-6 py-3 ${config.buttonClass} text-white font-medium rounded-lg hover:shadow-lg transition-all`}
            >
              Browse Organizations
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

        {/* Featured Organizations */}
        {stats?.featured_organizations && stats.featured_organizations.length > 0 && (
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
      </div>
    </div>
  )
}