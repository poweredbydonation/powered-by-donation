'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, ExternalLink } from 'lucide-react'

interface JustGivingCharity {
  charityId: number
  name: string
  description: string
  logoAbsoluteUrl?: string
}

interface CharitySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onCharitySelect: (charityId: string) => void
  donationAmount: number
}

export default function CharitySearchModal({ 
  isOpen, 
  onClose, 
  onCharitySelect, 
  donationAmount 
}: CharitySearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<JustGivingCharity[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const modalRef = useRef<HTMLDivElement>(null)

  // Popular charities to show by default
  const popularCharities: JustGivingCharity[] = [
    { charityId: 2050, name: 'Great Ormond Street Hospital Children\'s Charity', description: 'Supporting seriously ill children and their families' },
    { charityId: 183092, name: 'Cancer Research UK', description: 'Funding research to beat cancer sooner' },
    { charityId: 114015, name: 'British Red Cross', description: 'Helping people in crisis, whoever and wherever they are' },
    { charityId: 6, name: 'RSPCA', description: 'Preventing cruelty and promoting kindness to animals' },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      await performSearch(searchTerm.trim())
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Close modal on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const performSearch = async (query: string) => {
    setIsSearching(true)
    setSearchError('')
    
    try {
      // First try cached search for fast results
      const cachedResponse = await fetch(`/api/charities/cached?q=${encodeURIComponent(query)}&limit=8`)
      const cachedData = await cachedResponse.json()
      
      if (cachedData.success && cachedData.data && cachedData.data.searchResults.length > 0) {
        setSearchResults(cachedData.data.searchResults)
        return
      }
      
      // If no cached results, fall back to live JustGiving API search
      const liveResponse = await fetch(`/api/charities/search?q=${encodeURIComponent(query)}&maxResults=8`)
      const liveData = await liveResponse.json()
      
      if (liveData.success && liveData.data) {
        setSearchResults(liveData.data.searchResults || [])
      } else {
        setSearchError(liveData.error || 'Failed to search charities')
      }
    } catch (error) {
      console.error('Charity search error:', error)
      setSearchError('Network error occurred')
    } finally {
      setIsSearching(false)
    }
  }

  const handleCharityClick = (charity: JustGivingCharity) => {
    console.log('🎯 User selected charity:', charity)
    console.log('🔢 Charity ID being passed:', charity.charityId.toString())
    onCharitySelect(charity.charityId.toString())
  }

  if (!isOpen) return null

  const displayCharities = searchTerm.trim().length < 2 ? popularCharities : searchResults

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Choose Your Charity
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Your {formatCurrency(donationAmount)} donation will go directly to your chosen charity via JustGiving.
          </p>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for charities (e.g., 'cancer', 'children', 'animals')"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            {isSearching && (
              <div className="absolute right-3 top-3">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {searchError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{searchError}</p>
              <p className="text-sm text-gray-500">
                You can also browse charities directly on{' '}
                <a
                  href="https://www.justgiving.com/search?q=&cat=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  JustGiving <ExternalLink className="inline h-3 w-3" />
                </a>
              </p>
            </div>
          ) : displayCharities.length === 0 && searchTerm.trim().length >= 2 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                No charities found for "{searchTerm}". Try different keywords.
              </p>
              <p className="text-sm text-gray-400">
                Or browse all charities on{' '}
                <a
                  href="https://www.justgiving.com/search?q=&cat=all"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  JustGiving <ExternalLink className="inline h-3 w-3" />
                </a>
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchTerm.trim().length < 2 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Popular Charities</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Or search above to find any JustGiving registered charity
                  </p>
                </div>
              )}

              {displayCharities.map((charity) => (
                <button
                  key={charity.charityId}
                  onClick={() => handleCharityClick(charity)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {charity.logoAbsoluteUrl && (
                      <img
                        src={charity.logoAbsoluteUrl}
                        alt={charity.name}
                        className="w-12 h-12 object-contain rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        {charity.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {charity.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          ID: {charity.charityId}
                        </span>
                        <span className="text-sm font-medium text-green-600">
                          Donate {formatCurrency(donationAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">All donations are secure and go directly to charity</span>
            <a
              href="https://www.justgiving.com/search?q=&cat=all"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center"
            >
              Browse all charities <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}