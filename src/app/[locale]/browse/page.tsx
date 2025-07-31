import MultilingualNavbar from '@/components/MultilingualNavbar'
import { Search, MapPin, Heart, Star } from 'lucide-react'

interface BrowsePageProps {
  params: {
    locale: string
  }
}

export default async function BrowsePage({ params }: BrowsePageProps) {
  const locale = params.locale

  // Load messages directly from JSON files
  let messages: any = {}
  try {
    messages = (await import(`../../../messages/${locale}.json`)).default
  } catch (error) {
    // Fallback to English
    messages = (await import(`../../../messages/en.json`)).default
  }

  // Mock services data for demo
  const mockServices = [
    {
      id: 1,
      title: "Professional Website Design",
      description: "Custom website design and development for small businesses and startups",
      donation_amount: 150,
      provider: "Sarah Chen",
      location: "Sydney, NSW",
      charity_type: "Any Charity",
      rating: 4.9
    },
    {
      id: 2,
      title: "Business Strategy Consulting",
      description: "One-on-one business strategy session to help grow your company",
      donation_amount: 75,
      provider: "Michael Rodriguez",
      location: "Melbourne, VIC",
      charity_type: "Environmental Causes",
      rating: 4.8
    },
    {
      id: 3,
      title: "Family Photography Session",
      description: "Professional family portraits in a location of your choice",
      donation_amount: 200,
      provider: "Emma Thompson",
      location: "Brisbane, QLD",
      charity_type: "Animal Welfare",
      rating: 5.0
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      <MultilingualNavbar locale={locale} messages={messages} />
      
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {messages.services?.browse?.title || 'Browse Services'}
            </h1>
            <p className="text-lg text-gray-600 max-w-3xl">
              {messages.services?.browse?.subtitle || 'Find professional services and support charities'}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={messages.common?.search || 'Search services...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <select className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white">
                  <option>{messages.services?.browse?.allLocations || 'All Locations'}</option>
                  <option>Sydney, NSW</option>
                  <option>Melbourne, VIC</option>
                  <option>Brisbane, QLD</option>
                </select>
              </div>

              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                {messages.common?.search || 'Search'}
              </button>
            </div>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {mockServices.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {service.title}
                    </h3>
                    <div className="flex items-center text-yellow-400 ml-2">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="text-sm text-gray-600 ml-1">{service.rating}</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="font-medium">{messages.services?.browse?.provider || 'Provider'}:</span>
                      <span className="ml-1">{service.provider}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {service.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Heart className="h-3 w-3 mr-1" />
                      {service.charity_type}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold text-green-600">
                      ${service.donation_amount}
                    </div>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                      {messages.common?.view || 'View Details'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Community Impact Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {messages.services?.browse?.communityImpact?.title || 'Community Impact'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">47</div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.activeServices || 'Active Services'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">$12,350</div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.totalDonationPotential || 'Total Donation Potential'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">23</div>
                <div className="text-sm text-gray-500">
                  {messages.services?.browse?.communityImpact?.activeProviders || 'Active Providers'}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center mt-4">
              {messages.services?.browse?.communityImpact?.donationsNote || 'All donations go directly to registered charities via JustGiving'}
            </p>
          </div>

          {/* Call to Action for Providers */}
          <div className="mt-12 bg-blue-50 rounded-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {messages.services?.browse?.callToAction?.title || 'Want to offer your services?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {messages.services?.browse?.callToAction?.description || 'Join our community of providers and help charities while showcasing your skills.'}
            </p>
            <a 
              href={`/${locale}/dashboard`}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors inline-block"
            >
              {messages.services?.browse?.callToAction?.button || 'Get Started'}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}