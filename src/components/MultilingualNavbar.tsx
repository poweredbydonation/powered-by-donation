interface MultilingualNavbarProps {
  locale: string
  messages: any
}

export default function MultilingualNavbar({ locale, messages }: MultilingualNavbarProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href={`/${locale}`} className="text-xl font-bold text-blue-600">
              Powered by Donation
            </a>
          </div>

          <div className="flex items-center space-x-6">
            {/* Navigation Links */}
            <a 
              href={`/${locale}/browse`}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {messages?.nav?.browse || 'Browse Services'}
            </a>
            
            <a 
              href={`/${locale}/dashboard`}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {messages?.nav?.dashboard || 'Dashboard'}
            </a>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-3">
              <a 
                href={`/${locale}/login`}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {messages?.nav?.login || 'Sign In'}
              </a>
              <a 
                href={`/${locale}/signup`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Sign Up
              </a>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center space-x-2 border-l pl-6">
              <span className="text-sm text-gray-500">
                {messages?.language?.select || 'Language'}:
              </span>
              <div className="flex space-x-1">
                <a 
                  href="/en" 
                  className={`px-2 py-1 rounded text-sm ${locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={messages?.language?.en || 'English'}
                >
                  🇺🇸
                </a>
                <a 
                  href="/es" 
                  className={`px-2 py-1 rounded text-sm ${locale === 'es' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={messages?.language?.es || 'Español'}
                >
                  🇪🇸
                </a>
                <a 
                  href="/tr" 
                  className={`px-2 py-1 rounded text-sm ${locale === 'tr' ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                  title={messages?.language?.tr || 'Türkçe'}
                >
                  🇹🇷
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}