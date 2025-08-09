'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePendingDonations } from '@/hooks/usePendingDonations'
import { LANGUAGES, getOtherLanguages, getLanguageByCode } from '@/config/languages'
import PlatformSelector from './PlatformSelector'

interface MultilingualNavbarProps {
  locale: string
  messages: any
}

export default function MultilingualNavbar({ locale, messages }: MultilingualNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { pendingCount } = usePendingDonations()
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  
  console.log('=== MULTILINGUAL NAVBAR DEBUG ===')
  console.log('MultilingualNavbar received locale prop:', locale)
  console.log('MultilingualNavbar pathname:', pathname)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangOpen(false)
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
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
        <div className="flex justify-between">
          {/* Left Side - Logo and Tagline (two rows) */}
          <div className="flex flex-col justify-center py-3">
            <a href={`/${locale}`} className="text-xl font-bold text-blue-600">
              <span className="hidden sm:inline">Powered by Donation</span>
              <span className="sm:hidden">PD</span>
            </a>
            {messages?.nav?.tagline && messages.nav.tagline.trim() !== '' && (
              <div className="text-sm text-gray-600 mt-1 hidden sm:block">
                {messages.nav.tagline}
              </div>
            )}
          </div>

          {/* Desktop Navigation - Right Side */}
          <div className="hidden md:flex items-center space-x-6">
            {/* Browse Services + Platform + Language (two rows) */}
            <div className="flex flex-col justify-center space-y-1">
              <a 
                href={`/${locale}/browse`}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors text-right"
              >
                {messages?.nav?.browse || 'Browse Services'}
              </a>
              
              {/* Platform + Language Selectors */}
              <div className="flex items-center justify-center space-x-2">
                {/* Platform Selector */}
                <PlatformSelector />
                
                {/* Language Dropdown */}
                <div ref={langDropdownRef} className="relative">
                  <button
                    onClick={() => setIsLangOpen(!isLangOpen)}
                    className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    <span className="bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 px-2 py-1 rounded-full transition-colors">
                      {currentLang.nativeName}
                    </span>
                  </button>
                  
                  {isLangOpen && (
                    <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border z-50">
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
            </div>
            
            {/* Authentication-aware navigation */}
            {!mounted ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : user ? (
              <>
                {/* Profile Photo Dropdown */}
                <div ref={profileDropdownRef} className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-600">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        {/* Pending Donations Notification */}
                        {pendingCount > 0 && (
                          <a
                            href={`/${locale}/dashboard/donations`}
                            className="block w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-800 px-3 py-2 rounded text-sm font-medium transition-colors text-left border border-yellow-200"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            <div className="flex items-center justify-between">
                              <span>Pending Donations</span>
                              <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                {pendingCount}
                              </span>
                            </div>
                            <div className="text-xs text-yellow-600 mt-1">
                              Click to check status
                            </div>
                          </a>
                        )}
                        
                        <a
                          href={`/${locale}/dashboard`}
                          className="block w-full text-gray-700 hover:bg-gray-50 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          {messages?.nav?.dashboard || 'Dashboard'}
                        </a>
                        
                        <div className="border-t pt-2 mt-2">
                          <button
                            onClick={() => {
                              handleSignOut()
                              setIsProfileOpen(false)
                            }}
                            className="w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors text-left"
                          >
                            {messages?.nav?.logout || 'Logout'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <a 
                href={`/${locale}/login`}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                {messages?.nav?.login || 'Login'}
              </a>
            )}
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
                  
                  {/* Mobile Pending Donations Notification */}
                  {pendingCount > 0 && (
                    <a
                      href={`/${locale}/dashboard/donations`}
                      className="block w-full bg-yellow-50 hover:bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg transition-colors font-medium text-left border border-yellow-200 mb-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center justify-between">
                        <span>Pending Donations</span>
                        <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded-full">
                          {pendingCount}
                        </span>
                      </div>
                      <div className="text-xs text-yellow-600 mt-1">
                        Click to check status
                      </div>
                    </a>
                  )}
                  
                  <a
                    href={`/${locale}/dashboard`}
                    className="block w-full bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 px-4 py-2 rounded-lg transition-colors font-medium text-left mb-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {messages?.nav?.dashboard || 'Dashboard'}
                  </a>
                  
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="block w-full bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-4 py-2 rounded-lg transition-colors font-medium text-left"
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

              {/* Mobile Platform Selector */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">Platform:</div>
                <div className="mb-4">
                  <PlatformSelector />
                </div>
              </div>

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