'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { EveryOrgNonprofitCache, ServiceWithPlatformFields } from '@/types/database'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import { ExternalLink, Users, TrendingUp, Calendar } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface NonprofitPageProps {
  params: {
    slug: string
    locale: string
  }
}

type ServiceWithFundraiser = ServiceWithPlatformFields & {
  users: {
    id: string
    full_name: string
    username: string
  }
}

export default function EveryOrgNonprofitPage({ params }: NonprofitPageProps) {
  const { locale, slug } = params
  const t = useTranslations('nonprofit')
  const [nonprofit, setNonprofit] = useState<EveryOrgNonprofitCache | null>(null)
  const [services, setServices] = useState<ServiceWithFundraiser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<any>({})

  useEffect(() => {
    async function loadNonprofitData() {
      const supabase = createClient()
      
      try {
        // Load messages
        const messagesModule = await import(`@/messages/${locale}.json`)
        setMessages(messagesModule.default)

        // Get nonprofit data from Every.org nonprofit cache
        const { data: nonprofitData, error: nonprofitError } = await supabase
          .from('every_org_nonprofit_cache')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()

        if (nonprofitError) {
          if (nonprofitError.code === 'PGRST116') {
            // No rows returned - nonprofit not found
            setError('Nonprofit not found')
            return
          }
          throw nonprofitError
        }

        setNonprofit(nonprofitData)

        // Get services that support this nonprofit (both any_charity and specific_charities types)
        // Note: We use charity_requirement_type even for nonprofits for database compatibility
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select(`
            *,
            users!inner(id, full_name, username)
          `)
          .eq('platform', 'every_org')
          .eq('is_active', true)
          .or(`charity_requirement_type.eq.any_charity,and(charity_requirement_type.eq.specific_charities,preferred_charities.cs."${nonprofitData.nonprofit_ein}")`)
          .order('created_at', { ascending: false })

        if (servicesError) {
          console.error('Error loading services:', servicesError)
          setServices([])
        } else {
          setServices(servicesData || [])
        }

      } catch (err) {
        console.error('Error loading nonprofit data:', err)
        setError('Failed to load nonprofit data')
      } finally {
        setLoading(false)
      }
    }

    loadNonprofitData()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MultilingualNavbar locale={locale} messages={messages} />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !nonprofit) {
    return notFound()
  }

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

  return (
    <div className="min-h-screen bg-gray-50">
      <MultilingualNavbar locale={locale} messages={messages} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Nonprofit Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            {nonprofit.logo_url && (
              <img 
                src={nonprofit.logo_url} 
                alt={`${nonprofit.name} logo`}
                className="w-16 h-16 object-contain rounded-lg border"
              />
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{nonprofit.name}</h1>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                  Every.org
                </span>
              </div>
              
              {nonprofit.description && (
                <p className="text-gray-600 mb-4">{nonprofit.description}</p>
              )}
              
              <div className="flex items-center gap-4 text-sm text-gray-500">
                {nonprofit.category && (
                  <span className="flex items-center gap-1">
                    Category: {nonprofit.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  EIN: {nonprofit.nonprofit_ein}
                </span>
                <a
                  href={`https://www.every.org/nonprofit/${nonprofit.nonprofit_ein}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-green-600 hover:text-green-800"
                >
                  View on Every.org
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-900">Total Donations</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {nonprofit.total_donations_count || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Total Impact</h3>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {nonprofit.total_amount_received ? formatCurrency(nonprofit.total_amount_received) : '$0'}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">This Month</h3>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {nonprofit.this_month_count || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-900">Available Services</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {services.length}
            </p>
          </div>
        </div>

        {/* Services Supporting This Nonprofit */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Services Supporting This Nonprofit
          </h2>
          
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(service.donation_amount)}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      Every.org
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {service.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      by {service.users.full_name || service.users.username}
                    </span>
                    <a
                      href={`/${locale}/services/${service.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                      className="text-green-600 hover:text-green-800 font-medium"
                    >
                      View Service
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                No services currently available for this nonprofit.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Check back later or browse other services that support any nonprofit.
              </p>
            </div>
          )}
        </div>

        {/* Phase 2 Notice */}
        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-800">
            <strong>Coming Soon:</strong> Every.org integration is in development. 
            Full nonprofit donation functionality will be available in Phase 2 of our platform expansion.
          </p>
        </div>

        {/* Anonymous Activity Note */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Privacy Notice:</strong> All donation activity is displayed anonymously to protect donor privacy. 
            Only aggregate statistics and service information are shown publicly.
          </p>
        </div>
      </div>
    </div>
  )
}