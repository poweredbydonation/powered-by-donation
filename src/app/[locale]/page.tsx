import MultilingualNavbar from '@/components/MultilingualNavbar'
import { Monitor, TrendingUp, Camera } from 'lucide-react'
import { getTranslations, getMessages } from 'next-intl/server'

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

  return (
    <div className="min-h-screen bg-white">
      <MultilingualNavbar locale={locale} messages={messages} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {t('title')}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          
          <div className="space-x-4">
            <a 
              href={`/${locale}/browse`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              {t('hero.browse_services')}
            </a>
            
            <a 
              href={`/${locale}/dashboard`}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 border border-blue-600 transition-colors inline-block"
            >
              {tNav('dashboard')}
            </a>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {t('how_it_works.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('how_it_works.step1.title')}
              </h3>
              <p className="text-gray-600">
                {t('how_it_works.step1.description')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('how_it_works.step2.title')}
              </h3>
              <p className="text-gray-600">
                {t('how_it_works.step2.description')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t('how_it_works.step3.title')}
              </h3>
              <p className="text-gray-600">
                {t('how_it_works.step3.description')}
              </p>
            </div>
          </div>
        </div>
      </div>

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