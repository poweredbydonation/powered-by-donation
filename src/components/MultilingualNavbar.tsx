'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { usePendingDonations } from '@/hooks/usePendingDonations'
import { LANGUAGES, getOtherLanguages, getLanguageByCode } from '@/config/languages'
import { getLocalizedServicesUrl } from '@/lib/utils/localized-urls'

interface PlatformStats {
  services: number
  justgiving: number
  everyorg: number
  acnc: number
}

interface MultilingualNavbarProps {
  locale: string
  messages: any
  platformStats: PlatformStats
}

export default function MultilingualNavbar({ locale, messages, platformStats }: MultilingualNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()
  const { pendingCount } = usePendingDonations()
  const langDropdownRef = useRef<HTMLDivElement>(null)
  const profileDropdownRef = useRef<HTMLDivElement>(null)
  

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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b">
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
            {/* Language Selector */}
            <div className="flex items-center justify-center">
              {/* Language Dropdown */}
              <div ref={langDropdownRef} className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 transition-colors"
                >
                  <span className="bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 px-2 py-1 rounded-full transition-colors flex items-center space-x-1">
                    <img 
                      src={currentLang.flagIcon} 
                      alt={`${currentLang.name} flag`}
                      className="w-4 h-4 rounded-sm object-cover"
                    />
                    <span>{currentLang.nativeName}</span>
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
                        <img 
                          src={lang.flagIcon} 
                          alt={`${lang.name} flag`}
                          className="w-5 h-5 rounded-sm object-cover"
                        />
                        <span className="text-sm">{lang.nativeName}</span>
                      </a>
                    ))}
                  </div>
                )}
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
                      <img 
                        src={lang.flagIcon} 
                        alt={`${lang.name} flag`}
                        className="w-5 h-5 rounded-sm object-cover"
                      />
                      <span className="text-sm">{lang.nativeName}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mini Platform Tiles - Hidden on mobile */}
      <div className="hidden md:block bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Powered by Donation Tile */}
            <a 
              href={`/${locale}/services`}
              className="group bg-purple-50 border border-purple-200 rounded-lg p-3 hover:border-purple-300 hover:bg-purple-100 transition-all text-center"
            >
              <div className="text-lg font-bold text-purple-600 mb-1">
                {platformStats.services.toLocaleString()} Free Services
              </div>
              <div className="text-xs text-purple-700 leading-tight">
                Free services you can get by donating to JustGiving and Every.org charities
              </div>
            </a>

            {/* JustGiving Tile */}
            <a 
              href={`/${locale}/justgiving/charities`}
              className="group bg-blue-50 border border-blue-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-100 transition-all text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/flags/1x1/gb.svg"
                  alt="United Kingdom"
                  className="w-4 h-4 rounded object-cover mr-1"
                />
                <span className="text-xs font-semibold text-blue-800">JustGiving</span>
              </div>
              <div className="text-lg font-bold text-blue-600 mb-1">
                {platformStats.justgiving.toLocaleString()} Charities
              </div>
              <div className="text-xs text-blue-700 leading-tight">
                UK's leading charity fundraising platform with extensive charity database
              </div>
            </a>

            {/* Every.org Tile */}
            <a 
              href={`/${locale}/everyorg/nonprofits`}
              className="group bg-green-50 border border-green-200 rounded-lg p-3 hover:border-green-300 hover:bg-green-100 transition-all text-center"
            >
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/flags/1x1/us.svg"
                  alt="United States"
                  className="w-4 h-4 rounded object-cover mr-1"
                />
                <span className="text-xs font-semibold text-green-800">Every.org</span>
              </div>
              <div className="text-lg font-bold text-green-600 mb-1">
                {platformStats.everyorg.toLocaleString()} Nonprofits
              </div>
              <div className="text-xs text-green-700 leading-tight">
                US-based nonprofit platform with verified organizations across America
              </div>
            </a>

            {/* ACNC Tile */}
            <a 
              href={`/${locale}/acnc/charities`}
              className="group bg-orange-50 border border-orange-200 rounded-lg p-3 hover:border-orange-300 hover:bg-orange-100 transition-all text-center relative"
            >
              <div className="flex items-center justify-center mb-2">
                <img
                  src="/flags/1x1/au.svg"
                  alt="Australia"
                  className="w-4 h-4 rounded object-cover mr-1"
                />
                <span className="text-xs font-semibold text-orange-800">ACNC</span>
              </div>
              <div className="text-lg font-bold text-orange-600 mb-1">
                {platformStats.acnc.toLocaleString()} Charities and Nonprofits
              </div>
              <div className="text-xs text-orange-700 leading-tight">
                Australian Charities and Not-for-profits Commission registry
              </div>
              <div className="absolute top-1 right-1 bg-orange-500 text-white text-xs px-1 py-0.5 rounded-full" style={{fontSize: '8px'}}>
                Browse Only
              </div>
            </a>
          </div>
        </div>
      </div>
    </nav>
  )
}