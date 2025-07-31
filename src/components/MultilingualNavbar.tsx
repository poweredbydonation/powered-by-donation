'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronDown } from 'lucide-react'

interface MultilingualNavbarProps {
  locale: string
  messages: any
}

const languages = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'yue', flag: '🇭🇰', name: '粵語' },
  { code: 'pa', flag: '🇮🇳', name: 'ਪੰਜਾਬੀ' },
  { code: 'el', flag: '🇬🇷', name: 'Ελληνικά' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano' },
  { code: 'tl', flag: '🇵🇭', name: 'Filipino' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी' },
  { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'tr', flag: '🇹🇷', name: 'Türkçe' },
]

export default function MultilingualNavbar({ locale, messages }: MultilingualNavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLangOpen, setIsLangOpen] = useState(false)
  const pathname = usePathname()
  
  const currentLang = languages.find(lang => lang.code === locale) || languages[0]
  const otherLangs = languages.filter(lang => lang.code !== locale)
  
  // Get the path without the locale prefix
  const getPathWithoutLocale = () => {
    return pathname.replace(`/${locale}`, '') || '/'
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <a href={`/${locale}`} className="text-xl font-bold text-blue-600">
              <span className="hidden sm:inline">Powered by Donation</span>
              <span className="sm:hidden">PD</span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
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

            <a 
              href={`/${locale}/login`}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {messages?.nav?.login || 'Login'}
            </a>

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
                      <span className="text-sm">{lang.name}</span>
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

              <a 
                href={`/${locale}/login`}
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {messages?.nav?.login || 'Login'}
              </a>

              {/* Mobile Language Selector */}
              <div className="border-t pt-4">
                <div className="text-sm text-gray-500 mb-2">Language:</div>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
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
                      <span className="text-sm">{lang.name}</span>
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