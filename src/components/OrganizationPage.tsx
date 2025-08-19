/**
 * Individual Organization Page Component
 * Displays detailed view of a single organization with services and donation options
 */

'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { DonationPlatform, OrganizationCache, Service } from '@/types/database'
import ServiceCard from '@/components/services/ServiceCard'
import { EntityType, buildPlatformUrl } from '@/lib/utils/entity-urls'
import { 
  ExternalLink, 
  MapPin, 
  Globe, 
  Mail, 
  Phone, 
  Calendar,
  TrendingUp,
  Plus,
  Users,
  Star,
  ArrowLeft
} from 'lucide-react'
import { parseOperatingCountries } from '@/lib/utils/country-codes'

interface OrganizationPageProps {
  locale: string
  platform: DonationPlatform
  entityType: EntityType
  messages?: any
  organization: OrganizationCache
}

export default function OrganizationPage({
  locale,
  platform,
  entityType,
  organization,
  messages
}: OrganizationPageProps) {
  const t = useTranslations('organization')
  const router = useRouter()

  // Services state
  const [services, setServices] = useState<Service[]>([])
  const [servicesLoading, setServicesLoading] = useState(false)
  const [servicesError, setServicesError] = useState<string | null>(null)

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

  // Load services supporting this organization
  useEffect(() => {
    const loadServices = async () => {
      setServicesLoading(true)
      setServicesError(null)

      try {
        const response = await fetch(
          `/api/services/by-organization?organization_id=${organization.id}&platform=${platform}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch services')
        }

        const data = await response.json()
        setServices(data.services || [])
      } catch (error) {
        console.error('Error loading services:', error)
        setServicesError('Failed to load services')
      } finally {
        setServicesLoading(false)
      }
    }

    if (organization.id) {
      loadServices()
    }
  }, [organization.id, platform])

  return (
    <>
      {/* Mobile Back Button Overlay */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => router.back()}
          className="bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg border border-gray-200 transition-colors duration-200"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </button>
      </div>

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
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Three Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* About Section */}
          <div className="space-y-6">
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

            {/* Services section removed for better performance - users can browse services separately */}
          </div>

          {/* Statistics Section */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Statistics</h3>
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

          </div>

          {/* Support This Organization Section */}
          <div className="space-y-6">
            <div className={`${config.bgClass} rounded-lg border p-6 text-center`}>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Support This Organization</h3>
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

      {/* Mobile Overlay Button - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="px-4 py-3">
          <Link
            href={`/${locale}/dashboard/services/create?platform=${platform}&organization=${organization.external_id}`}
            className={`w-full py-4 px-4 rounded-xl font-bold text-white text-lg shadow-lg ${config.buttonClass} transition-colors duration-200 flex items-center justify-center space-x-2`}
          >
            <span>🚀</span>
            <span>Create Service</span>
          </Link>
          
          {/* Organization name indicator */}
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">for {organization.display_name || organization.name}</span>
          </div>
        </div>
      </div>

      {/* Services Supporting This Organization */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Services Supporting This Organization
            </h2>
            <p className="text-gray-600 mt-1">
              Fundraisers offering skills in exchange for donations to this organization
            </p>
          </div>
          {services.length > 0 && (
            <div className="text-sm text-gray-500">
              {services.length} service{services.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>

        {servicesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-start space-x-4">
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

        {servicesError && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{servicesError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {!servicesLoading && !servicesError && services.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No services yet
              </h3>
              <p className="text-gray-600 mb-4">
                No fundraisers have created services specifically for this organization yet.
              </p>
              <Link
                href={`/${locale}/dashboard/services/new?organization=${organization.id}&platform=${platform}`}
                className={`inline-flex items-center px-4 py-2 ${config.buttonClass} text-white rounded-lg font-medium`}
              >
                <Plus className="h-4 w-4 mr-2" />
                Be the First to Create a Service
              </Link>
            </div>
          </div>
        )}

        {!servicesLoading && !servicesError && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service as Service & { user: { name: string; bio?: string; location?: string; } | null }}
                locale={locale}
              />
            ))}
          </div>
        )}

        {services.length > 4 && (
          <div className="text-center mt-8">
            <Link
              href={`/${locale}/services?org=${organization.id}`}
              className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white ${config.buttonClass}`}
            >
              View All Services Supporting This Organization
            </Link>
          </div>
        )}
      </div>
    </div>
    </>
  )
}