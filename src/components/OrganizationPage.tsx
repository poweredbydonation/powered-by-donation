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
      color: 'purple',
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-800',
      buttonClass: 'bg-[#7A04DD] hover:bg-[#540099]'
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
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Platform Indicator */}
          {platform === 'justgiving' && (
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-purple-200">
              <img
                src="/justgiving-logo.svg"
                alt="JustGiving"
                className="h-6 w-auto"
              />
              <span className="text-sm text-purple-800 font-medium">
                Registered charity on JustGiving
              </span>
            </div>
          )}
          {platform === 'everyorg' && (
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-green-200">
              <img
                src="/Logo_Green.svg"
                alt="Every.org"
                className="h-6 w-auto"
              />
              <span className="text-sm text-green-800 font-medium">
                Verified nonprofit on Every.org
              </span>
            </div>
          )}
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
                
                {(organization.profile_page_url || (platform === 'acnc' && organization.acnc_abn)) && (
                  <a
                    href={
                      organization.profile_page_url || 
                      (platform === 'acnc' && organization.acnc_abn 
                        ? `https://www.acnc.gov.au/charity/charities?search=${organization.acnc_abn}` 
                        : '')
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center ${config.textClass} hover:underline`}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {platform === 'acnc' ? 'Search ACNC Register' : `${config.name} Profile`}
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

          {/* Donate to Organization Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Donate on {config.name}</h3>
              
              <p className="text-sm text-gray-600 mb-6 text-center">
                Donate directly to {organization.display_name || organization.name} through {config.name}'s secure platform.
              </p>
              <Link
                href={organization.profile_page_url || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center px-6 py-3 ${config.buttonClass} text-white rounded-lg font-medium w-full justify-center transition-colors`}
              >
                Donate on {config.name}
              </Link>
            </div>
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
                href={`/${locale}/dashboard/services/create?platform=${platform}&organization=${organization.external_id}`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create a service for {organization.display_name || organization.name}
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
                platform={platform}
              />
            ))}
            
            {/* Blank card - Offer a service and fundraise */}
            <div className="bg-gradient-to-br from-green-50 via-white to-white border border-green-200 border-l-4 border-l-green-500 rounded-lg shadow-sm hover:shadow-lg hover:border-green-300 transition-all duration-200 flex flex-col">
              <div className="p-6 text-center flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Create a service for {organization.display_name || organization.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Offer your skills and fundraise for {organization.display_name || organization.name} through {config.name}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">
                      Your Impact
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      You Choose
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-green-600 uppercase tracking-wide font-medium mb-1">
                      Location
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      Any Location
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                  <div className="flex items-center">
                    <div className="text-sm">
                      <span className="text-gray-500">by </span>
                      <span className="font-medium text-gray-900">You</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Supporting this organization
                  </div>
                </div>

                <div className="mb-4 flex-1">
                  <div className="text-xs text-green-600 font-medium">
                    Ready to Start
                  </div>
                </div>

                {/* Button always at bottom */}
                <div className="mt-auto">
                  <Link
                    href={`/${locale}/dashboard/services/create?platform=${platform}&organization=${organization.external_id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Create a service for {organization.display_name || organization.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Donations Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Donations
          </h2>
          <p className="text-gray-600 mt-1">
            Recent donations to this organization
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donated and received services */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Donated and received services
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-l-blue-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">John Doe</span> donated <span className="font-semibold text-blue-600">$559</span> and got this service
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "I love you"
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">2 days ago</span>
                </div>
              </div>
              
              <div className="border-l-4 border-l-green-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Sarah Smith</span> donated <span className="font-semibold text-green-600">$320</span> and got web design service
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "Excellent work, very satisfied!"
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">5 days ago</span>
                </div>
              </div>

              <div className="border-l-4 border-l-purple-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Mike Johnson</span> donated <span className="font-semibold text-purple-600">$125</span> and got consulting service
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "Great advice, will recommend!"
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">1 week ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Donated directly */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Donated directly
            </h3>
            <div className="space-y-4">
              <div className="border-l-4 border-l-orange-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">George Wilson</span> donated <span className="font-semibold text-orange-600">$40</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "Keep up the great work!"
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">1 day ago</span>
                </div>
              </div>
              
              <div className="border-l-4 border-l-red-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Emma Davis</span> donated <span className="font-semibold text-red-600">$75</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "Supporting a great cause"
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">3 days ago</span>
                </div>
              </div>

              <div className="border-l-4 border-l-indigo-500 pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Alex Brown</span> donated <span className="font-semibold text-indigo-600">$100</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      "Happy to contribute to education"
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">1 week ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
    </>
  )
}