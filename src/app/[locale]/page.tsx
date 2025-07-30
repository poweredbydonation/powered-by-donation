import MultilingualNavbar from '@/components/MultilingualNavbar'
import { Monitor, TrendingUp, Camera } from 'lucide-react'

interface HomePageProps {
  params: {
    locale: string
  }
}

export default async function HomePage({ params }: HomePageProps) {
  const locale = params.locale

  // Load messages directly from JSON files
  let messages: any = {}
  try {
    messages = (await import(`../../messages/${locale}.json`)).default
  } catch (error) {
    // Fallback to English
    messages = (await import(`../../messages/en.json`)).default
  }

  return (
    <div className="min-h-screen bg-white">
      <MultilingualNavbar locale={locale} messages={messages} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {messages.home?.title || 'Powered by Donation'}
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {messages.home?.subtitle || 'Service marketplace where donations to charities unlock professional services'}
          </p>
          
          <div className="space-x-4">
            <a 
              href={`/${locale}/browse`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              {messages.home?.hero?.browse_services || 'Browse Services'}
            </a>
            
            <a 
              href={`/${locale}/dashboard`}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 border border-blue-600 transition-colors inline-block"
            >
              {messages?.nav?.dashboard || 'Dashboard'}
            </a>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {messages.home?.how_it_works?.title || 'How It Works'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {messages.home?.how_it_works?.step1?.title || 'Browse Services'}
              </h3>
              <p className="text-gray-600">
                {messages.home?.how_it_works?.step1?.description || 'Find professional services offered by community providers'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {messages.home?.how_it_works?.step2?.title || 'Choose a Charity'}
              </h3>
              <p className="text-gray-600">
                {messages.home?.how_it_works?.step2?.description || 'Select from registered charities to receive your donation'}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Camera className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {messages.home?.how_it_works?.step3?.title || 'Make Impact'}
              </h3>
              <p className="text-gray-600">
                {messages.home?.how_it_works?.step3?.description || 'Your donation unlocks the service and supports a great cause'}
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
              {messages.home?.recent_activity?.title || 'Recent Community Activity'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Example 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">
                  {messages.home?.recent_activity?.someone_donated || 'Someone donated'} $150
                </span>
                {' '}for Web Design {messages.home?.recent_activity?.via_service || 'via'} Cancer Research Australia
              </p>
              <p className="text-sm text-gray-500 mt-2">2 {messages.home?.recent_activity?.hours_ago || 'hours ago'}</p>
            </div>

            {/* Example 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">
                  {messages.home?.recent_activity?.someone_donated || 'Someone donated'} $75
                </span>
                {' '}for Business Consulting {messages.home?.recent_activity?.via_service || 'via'} Beyond Blue
              </p>
              <p className="text-sm text-gray-500 mt-2">5 {messages.home?.recent_activity?.hours_ago || 'hours ago'}</p>
            </div>

            {/* Example 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <p className="text-gray-700">
                <span className="font-medium">
                  {messages.home?.recent_activity?.someone_donated || 'Someone donated'} $200
                </span>
                {' '}for Photography {messages.home?.recent_activity?.via_service || 'via'} RSPCA NSW
              </p>
              <p className="text-sm text-gray-500 mt-2">1 day ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}