/**
 * Individual Organization Page Component
 * Displays detailed view of a single organization with services and donation options
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { DonationPlatform, OrganizationCache, Service } from '@/types/database'
import { EntityType, buildPlatformUrl } from '@/lib/utils/entity-urls'
import { createClient } from '@/lib/supabase/client'
import { 
  ExternalLink, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  Users,
  Star,
  Plus
} from 'lucide-react'
import { parseOperatingCountries } from '@/lib/utils/country-codes'

interface OrganizationPageProps {
  locale: string
  platform: DonationPlatform
  entityType: EntityType
  messages?: any
  organization: OrganizationCache
}

interface ServiceWithUser extends Service {
  users: {
    id: string
    name: string
    username?: string
  }
}

export default function OrganizationPage({
  locale,
  platform,
  entityType,
  organization,
  messages
}: OrganizationPageProps) {
  const t = useTranslations('organization')
  const [services, setServices] = useState<ServiceWithUser[]>([])
  const [loading, setLoading] = useState(true)

  const platformConfig = {
    justgiving: {
      name: 'JustGiving',
      color: 'blue',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-800',
      buttonClass: 'bg-blue-600 hover:bg-blue-700'
    },
    everyorg: {
      name: 'Every.org',
      color: 'green',
      bgClass: 'bg-green-50', 
      textClass: 'text-green-800',
      buttonClass: 'bg-green-600 hover:bg-green-700'
    },
    acnc: {
      name: 'ACNC',
      color: 'orange',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-800',
      buttonClass: 'bg-orange-600 hover:bg-orange-700'
    }
  }

  const config = platformConfig[platform]

  // Load related services
  useEffect(() => {
    async function loadServices() {
      const supabase = createClient()
      
      try {
        // Get services that support this organization
        const { data: servicesData } = await supabase
          .from('services')
          .select(`
            *,
            users!inner(id, name, username)
          `)
          .eq('platform', platform)
          .eq('is_active', true)
          .or(`charity_requirement_type.eq.any_charity,and(charity_requirement_type.eq.specific_charities,organization_id.eq.${organization.external_id})`)
          .order('created_at', { ascending: false })
          .limit(6)

        setServices(servicesData || [])
      } catch (error) {
        console.error('Error loading services:', error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [platform, organization.external_id])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`${config.bgClass} border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-start space-x-6">
            {/* Organization Logo */}
            {organization.logo_url && (
              <img
                src={organization.logo_absolute_url || organization.logo_url}
                alt={organization.name}
                className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {organization.display_name || organization.name}
                </h1>
                {organization.is_featured && (
                  <Star className="h-6 w-6 text-yellow-500 fill-current" />
                )}
              </div>

              {/* Category & Registration */}
              <div className="flex items-center space-x-4 mb-4">
                {organization.category && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.textClass} bg-white`}>
                    {organization.category}
                  </span>
                )}
                {organization.registration_number && (
                  <span className="text-sm text-gray-600">
                    Reg: {organization.registration_number}
                  </span>
                )}
              </div>

              {/* Location */}
              {organization.address_city && (
                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {organization.address_city}
                    {organization.address_county && `, ${organization.address_county}`}
                    {organization.address_country && `, ${organization.address_country}`}
                  </span>
                </div>
              )}

              {/* External Links */}
              <div className="flex items-center space-x-4">
                {organization.website_url && (
                  <a
                    href={organization.website_url.startsWith('http') ? organization.website_url : `https://${organization.website_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center ${config.textClass} hover:underline`}
                  >
                    <Globe className="h-4 w-4 mr-1" />
                    Website
                  </a>
                )}
                
                {organization.profile_page_url && (
                  <a
                    href={organization.profile_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center ${config.textClass} hover:underline`}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {config.name} Profile
                  </a>
                )}
                
                {organization.email_address && (
                  <a
                    href={`mailto:${organization.email_address}`}
                    className={`flex items-center ${config.textClass} hover:underline`}
                  >
                    <Mail className="h-4 w-4 mr-1" />
                    Contact
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {organization.description && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {organization.description}
                </p>
              </div>
            )}

            {/* Impact Statements */}
            {(organization.impact_statement_what || organization.impact_statement_why) && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Impact</h2>
                {organization.impact_statement_what && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">What we do</h3>
                    <p className="text-gray-700">{organization.impact_statement_what}</p>
                  </div>
                )}
                {organization.impact_statement_why && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Why it matters</h3>
                    <p className="text-gray-700">{organization.impact_statement_why}</p>
                  </div>
                )}
              </div>
            )}

            {/* ACNC Information - only for ACNC platform */}
            {platform === 'acnc' && (
              <div className="bg-white rounded-lg border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">ACNC Registration Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Registration Info */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 text-lg">Registration Information</h3>
                    
                    {organization.acnc_abn && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">ABN</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_abn}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_charity_legal_name && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Legal Name</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_charity_legal_name}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_other_organisation_names && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Other Names</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_other_organisation_names}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_registration_date && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Registration Date</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_registration_date}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_date_organisation_established && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Date Established</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_date_organisation_established}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_charity_size && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Charity Size</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_charity_size}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_number_of_responsible_persons && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Responsible Persons</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_number_of_responsible_persons}</dd>
                      </div>
                    )}
                    
                    {organization.acnc_financial_year_end && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Financial Year End</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_financial_year_end}</dd>
                      </div>
                    )}
                  </div>

                  {/* Operations & Classifications */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 text-lg">Operations & Status</h3>
                    
                    {/* States of Operation */}
                    <div>
                      <dt className="text-sm font-medium text-gray-500 mb-2">States of Operation</dt>
                      <dd className="flex flex-wrap gap-1">
                        {organization.acnc_operates_in_act === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">ACT</span>
                        )}
                        {organization.acnc_operates_in_nsw === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">NSW</span>
                        )}
                        {organization.acnc_operates_in_nt === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">NT</span>
                        )}
                        {organization.acnc_operates_in_qld === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">QLD</span>
                        )}
                        {organization.acnc_operates_in_sa === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">SA</span>
                        )}
                        {organization.acnc_operates_in_tas === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">TAS</span>
                        )}
                        {organization.acnc_operates_in_vic === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">VIC</span>
                        )}
                        {organization.acnc_operates_in_wa === 'Y' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">WA</span>
                        )}
                      </dd>
                    </div>
                    
                    {organization.acnc_operating_countries && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Operating Countries</dt>
                        <dd className="text-sm text-gray-900">
                          {parseOperatingCountries(organization.acnc_operating_countries).join(', ')}
                        </dd>
                      </div>
                    )}
                    
                    {organization.acnc_address_type && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Address Type</dt>
                        <dd className="text-sm text-gray-900">{organization.acnc_address_type}</dd>
                      </div>
                    )}
                    
                    {/* Classification Status */}
                    <div className="space-y-2">
                      {organization.acnc_pbi && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Public Benevolent Institution (PBI)</dt>
                          <dd className="text-sm text-gray-900">{organization.acnc_pbi}</dd>
                        </div>
                      )}
                      
                      {organization.acnc_hpc && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Health Promotion Charity (HPC)</dt>
                          <dd className="text-sm text-gray-900">{organization.acnc_hpc}</dd>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Charitable Purposes */}
                {organization.acnc_purposes && Object.keys(organization.acnc_purposes).length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 text-lg mb-3">Charitable Purposes</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(organization.acnc_purposes).map(([purpose, value]) => {
                        if (value === true || value === 'true') {
                          return (
                            <span
                              key={purpose}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.textClass} bg-white border`}
                            >
                              {purpose.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )}

                {/* Beneficiaries */}
                {organization.acnc_beneficiaries && Object.keys(organization.acnc_beneficiaries).length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-medium text-gray-900 text-lg mb-3">Beneficiaries</h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(organization.acnc_beneficiaries).map(([beneficiary, value]) => {
                        if (value === true || value === 'true') {
                          return (
                            <span
                              key={beneficiary}
                              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.textClass} bg-white border`}
                            >
                              {beneficiary.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Related Services */}
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Available Services</h2>
                <Link
                  href={`/${locale}/services?platform=${platform}&organization=${organization.slug}`}
                  className={`text-sm ${config.textClass} hover:underline`}
                >
                  View all services
                </Link>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse border rounded-lg p-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : services.length > 0 ? (
                <div className="space-y-4">
                  {services.map((service) => (
                    <Link
                      key={service.id}
                      href={`/${locale}/services/${service.id}`}
                      className="block border rounded-lg p-4 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            {service.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {service.description}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 space-x-4">
                            <span>by {service.users.name}</span>
                            <span>A${service.donation_amount}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No services available for this organization yet.
                  </p>
                  <Link
                    href={`/${locale}/dashboard/services/create?platform=${platform}&organization=${organization.external_id}`}
                    className={`inline-flex items-center px-4 py-2 ${config.buttonClass} text-white rounded-lg font-medium`}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Service
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Donations</span>
                  <span className="font-medium">{organization.total_donations_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">This Month</span>
                  <span className="font-medium">{organization.this_month_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Page Views</span>
                  <span className="font-medium">{organization.page_views || 0}</span>
                </div>
              </div>
            </div>

            {/* Create Service CTA */}
            <div className={`${config.bgClass} rounded-lg border p-6 text-center`}>
              <h3 className="font-semibold text-gray-900 mb-2">Support This Organization</h3>
              <p className="text-sm text-gray-600 mb-4">
                Create a service and donate the proceeds to this organization.
              </p>
              <Link
                href={`/${locale}/dashboard/services/create?platform=${platform}&organization=${organization.external_id}`}
                className={`inline-flex items-center px-4 py-2 ${config.buttonClass} text-white rounded-lg font-medium w-full justify-center`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}