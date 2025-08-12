import MultilingualNavbar from '@/components/MultilingualNavbar'
import PlatformSelector from '@/components/PlatformSelector'
import { Monitor, TrendingUp, Camera, ExternalLink, Users } from 'lucide-react'
import { getTranslations, getMessages } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface HomePageProps {
  params: {
    locale: string
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params
  const t = await getTranslations({ locale, namespace: 'home' })
  const tNav = await getTranslations({ locale, namespace: 'nav' })
  const messages = await getMessages({ locale })

  // Load platform statistics for homepage
  const supabase = createClient()
  const [platformStats, featuredOrgs] = await Promise.all([
    // Get platform statistics
    supabase
      .from('organization_cache')
      .select('platform', { count: 'exact' })
      .eq('is_active', true),
    
    // Get featured organizations from both platforms
    supabase
      .from('organization_cache')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('total_donations_count', { ascending: false })
      .limit(6)
  ])

  const totalOrganizations = platformStats.count || 0
  const justgivingCount = platformStats.data?.filter(o => o.platform === 'justgiving').length || 0
  const everyorgCount = platformStats.data?.filter(o => o.platform === 'everyorg').length || 0

  return (
    <div className="min-h-screen bg-white">
      <MultilingualNavbar locale={locale} messages={messages} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          
          {/* Platform Stats */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-blue-600">{totalOrganizations.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Organizations</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-blue-600">{justgivingCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">JustGiving</div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border">
                <div className="text-2xl font-bold text-green-600">{everyorgCount.toLocaleString()}</div>
                <div className="text-sm text-gray-600">Every.org</div>
              </div>
            </div>
          </div>
          
          {/* Platform Links - Above Everything */}
          <div className="mb-16">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Platform</h2>
              <p className="text-gray-600">Browse organizations and start donating</p>
            </div>
            <div className="flex items-center justify-center space-x-8">
              <Link 
                href={`/${locale}/justgiving/charities`}
                className="flex items-center bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 px-6 py-4 rounded-xl transition-all text-blue-700 hover:text-blue-800 min-w-[200px]"
              >
                <Users className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="font-bold text-lg">JustGiving</div>
                  <div className="text-sm text-blue-600">{justgivingCount.toLocaleString()} Charities</div>
                </div>
              </Link>
              
              <Link 
                href={`/${locale}/everyorg/nonprofits`}
                className="flex items-center bg-green-50 hover:bg-green-100 border-2 border-green-200 hover:border-green-300 px-6 py-4 rounded-xl transition-all text-green-700 hover:text-green-800 min-w-[200px]"
              >
                <Users className="h-6 w-6 mr-3" />
                <div className="text-left">
                  <div className="font-bold text-lg">Every.org</div>
                  <div className="text-sm text-green-600">{everyorgCount.toLocaleString()} Nonprofits</div>
                </div>
              </Link>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Donors */}
            <div className="flex flex-col">
              <div className="flex items-start space-x-4">
                <div className="w-10"></div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-left">For Donors</h2>
              </div>
              
              <div className="space-y-6 mb-8 flex-grow text-left">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                    <Monitor className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t('how_it_works.for_donors.step1.title')}
                    </h4>
                    <p className="text-gray-600">
                      {t('how_it_works.for_donors.step1.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-2 rounded-full flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t('how_it_works.for_donors.step2.title')}
                    </h4>
                    <p className="text-gray-600">
                      {t('how_it_works.for_donors.step2.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-purple-100 p-2 rounded-full flex-shrink-0">
                    <Camera className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t('how_it_works.for_donors.step3.title')}
                    </h4>
                    <p className="text-gray-600">
                      {t('how_it_works.for_donors.step3.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10"></div>
                <Link 
                  href={`/${locale}/services`}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block w-fit text-center"
                  style={{ minWidth: '280px' }}
                >
                  {t('hero.donate_get_service')}
                </Link>
              </div>
            </div>
            
            {/* For Fundraisers */}
            <div className="flex flex-col">
              <div className="flex items-start space-x-4">
                <div className="w-10"></div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-left">For Fundraisers</h2>
              </div>
              
              <div className="space-y-6 mb-8 flex-grow text-left">
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-100 p-2 rounded-full flex-shrink-0">
                    <Monitor className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t('how_it_works.for_fundraisers.step1.title')}
                    </h4>
                    <p className="text-gray-600">
                      {t('how_it_works.for_fundraisers.step1.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t('how_it_works.for_fundraisers.step2.title')}
                    </h4>
                    <p className="text-gray-600">
                      {t('how_it_works.for_fundraisers.step2.description')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-2 rounded-full flex-shrink-0">
                    <Camera className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {t('how_it_works.for_fundraisers.step3.title')}
                    </h4>
                    <p className="text-gray-600">
                      {t('how_it_works.for_fundraisers.step3.description')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10"></div>
                <a 
                  href={`/${locale}/dashboard/services/create`}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-block w-fit text-center"
                  style={{ minWidth: '280px' }}
                >
                  {t('hero.offer_service_fundraise')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Browse Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Browse by Platform
            </h2>
            <p className="text-lg text-gray-600">
              Choose your preferred donation platform and explore organizations
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* JustGiving Card */}
            <Link 
              href={`/${locale}/justgiving`}
              className="group bg-blue-50 border-2 border-blue-200 rounded-xl p-8 hover:border-blue-300 hover:bg-blue-100 transition-all"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {justgivingCount.toLocaleString()}
                </div>
                <h3 className="text-2xl font-semibold text-blue-800 mb-3">JustGiving</h3>
                <p className="text-blue-700 mb-4">
                  UK's leading charity fundraising platform with extensive charity database
                </p>
                <div className="flex items-center justify-center text-blue-600 group-hover:text-blue-800">
                  <span className="mr-2">Browse Charities</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </Link>

            {/* Every.org Card */}
            <Link 
              href={`/${locale}/everyorg`}
              className="group bg-green-50 border-2 border-green-200 rounded-xl p-8 hover:border-green-300 hover:bg-green-100 transition-all"
            >
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {everyorgCount.toLocaleString()}
                </div>
                <h3 className="text-2xl font-semibold text-green-800 mb-3">Every.org</h3>
                <p className="text-green-700 mb-4">
                  Global nonprofit platform connecting donors with verified organizations worldwide
                </p>
                <div className="flex items-center justify-center text-green-600 group-hover:text-green-800">
                  <span className="mr-2">Browse Nonprofits</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Organizations */}
      {featuredOrgs.data && featuredOrgs.data.length > 0 && (
        <div className="py-16 bg-gray-50">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Organizations
              </h2>
              <p className="text-lg text-gray-600">
                Popular organizations receiving donations through our platform
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredOrgs.data.map((org) => (
                <Link
                  key={org.id}
                  href={`/${locale}/${org.platform}/${org.platform === 'justgiving' ? 'charities' : 'nonprofits'}/${org.slug}`}
                  className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-4">
                    {org.logo_url && (
                      <img
                        src={org.logo_absolute_url || org.logo_url}
                        alt={org.name}
                        className="w-12 h-12 rounded object-cover flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {org.display_name || org.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {org.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          org.platform === 'justgiving' 
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {org.platform === 'justgiving' ? 'JustGiving' : 'Every.org'}
                        </span>
                        {org.total_donations_count > 0 && (
                          <span className="text-gray-500">
                            {org.total_donations_count} donations
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity Examples */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('recent_activity.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Example 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">
                  {t('recent_activity.someone_donated')} $150
                </span>
                {' '}{t('recent_activity.via_service')} Web Design → Cancer Research Australia
              </p>
              <p className="text-sm text-gray-500 mt-2">2 {t('recent_activity.hours_ago')}</p>
            </div>

            {/* Example 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">
                  {t('recent_activity.someone_donated')} $75
                </span>
                {' '}{t('recent_activity.via_service')} Business Consulting → Beyond Blue
              </p>
              <p className="text-sm text-gray-500 mt-2">5 {t('recent_activity.hours_ago')}</p>
            </div>

            {/* Example 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">
                  {t('recent_activity.someone_donated')} $200
                </span>
                {' '}{t('recent_activity.via_service')} Photography → RSPCA NSW
              </p>
              <p className="text-sm text-gray-500 mt-2">1 {t('recent_activity.days_ago')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}