'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { LANGUAGES, getOtherLanguages, getLanguageByCode } from '@/config/languages'

interface MultilingualNavbarProps {
  locale: string
  messages: any
}

export default function MultilingualNavbar({ locale, messages }: MultilingualNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  
  console.log('=== MULTILINGUAL NAVBAR DEBUG ===')
  console.log('MultilingualNavbar received locale prop:', locale)
  console.log('MultilingualNavbar pathname:', pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      window.location.href = `/${locale}`
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }
  
  const currentLang = getLanguageByCode(locale) || LANGUAGES[0]
  const otherLangs = getOtherLanguages(locale)
  
  // Get the path without the locale prefix
  const getPathWithoutLocale = () => {
    console.log('MultilingualNavbar - pathname:', pathname)
    console.log('MultilingualNavbar - locale:', locale)
    
    // Remove the current locale from the beginning of the pathname
    // Handle both cases: with and without leading slash
    let pathWithoutLocale = pathname
    if (pathWithoutLocale.startsWith(`/${locale}`)) {
      pathWithoutLocale = pathWithoutLocale.substring(`/${locale}`.length)
    }
    
    // Ensure we always have a leading slash or default to '/'
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = pathWithoutLocale || '/'
    }
    if (pathWithoutLocale === '') {
      pathWithoutLocale = '/'
    }
    
    console.log('MultilingualNavbar - getPathWithoutLocale result:', pathWithoutLocale)
    return pathWithoutLocale
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex flex-col justify-center">
              <a href={`/${locale}`} className="text-xl font-bold text-blue-600">
                <span className="hidden sm:inline">Powered by Donation</span>
                <span className="sm:hidden">PD</span>
              </a>
              {locale !== 'en' && messages?.nav?.tagline && messages.nav.tagline.trim() !== '' && (
                <div className="text-sm text-gray-600 mt-0.5 hidden sm:block">
                  {messages.nav.tagline}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <a 
              href={`/${locale}/browse`}
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              {messages?.nav?.browse || 'Browse Services'}
            </a>
            
            {/* Authentication-aware navigation */}
            {!mounted ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : user ? (
              <>
                <a 
                  href={`/${locale}/dashboard`}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  {messages?.nav?.dashboard || 'Dashboard'}
                </a>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700 hidden lg:block">
                      {user.email}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleSignOut}
                    className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-1 rounded text-sm font-medium transition-colors"
                  >
                    {messages?.nav?.logout || 'Logout'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <a 
                  href={`/${locale}/dashboard`}
                  className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
                >
                  {messages?.nav?.dashboard || 'Dashboard'}
                </a>

                <a 
                  href={`/${locale}/login`}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {messages?.nav?.login || 'Login'}
                </a>
              </>
            )}

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <span className="text-lg">{currentLang.flag}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-50">
                  {otherLangs.map((lang) => (
                    <a
                      key={lang.code}
                      href={`/${lang.code}${getPathWithoutLocale()}`}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsLangOpen(false)}
                    >
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-sm">{lang.nativeName}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center text-gray-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-4 space-y-4">
              <a 
                href={`/${locale}/browse`}
                className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {messages?.nav?.browse || 'Browse Services'}
              </a>
              
              <a 
                href={`/${locale}/dashboard`}
                className="block text-gray-700 hover:text-blue-600 font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {messages?.nav?.dashboard || 'Dashboard'}
              </a>

              {/* Mobile Authentication */}
              {!mounted ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : loading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : user ? (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-gray-700">{user.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-colors font-medium text-center"
                  >
                    {messages?.nav?.logout || 'Logout'}
                  </button>
                </div>
              ) : (
                <a 
                  href={`/${locale}/login`}
                  className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {messages?.nav?.login || 'Login'}
                </a>
              )}

              {/* Mobile Language Selector */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">Language:</div>
                <div className="grid grid-cols-2 gap-2">
                  {LANGUAGES.map((lang) => (
                    <a
                      key={lang.code}
                      href={`/${lang.code}${getPathWithoutLocale()}`}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                        lang.code === locale 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <span>{lang.flag}</span>
                      <span className="text-sm">{lang.nativeName}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}