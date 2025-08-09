'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, Check, ExternalLink } from 'lucide-react'
import { DonationPlatform } from '@/types/database'

interface JustGivingCharity {
  charityId: number
  name: string
  description: string
  logoAbsoluteUrl?: string
}

interface SelectedCharity {
  justgiving_charity_id: string
  name: string
  description?: string
  logo_url?: string
}

interface CharitySelectorProps {
  selectedCharities: SelectedCharity[]
  onCharitiesChange: (charities: SelectedCharity[]) => void
  maxCharities?: number
  disabled?: boolean
  platform: DonationPlatform
}

export default function CharitySelector({ 
  selectedCharities, 
  onCharitiesChange, 
  maxCharities = 5,
  disabled = false,
  platform
}: CharitySelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<JustGivingCharity[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle search with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([])
      setShowDropdown(false)
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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const performSearch = async (query: string) => {
    if (disabled) return
    
    // Only support JustGiving for now
    if (platform !== 'justgiving') {
      setSearchError('Every.org integration coming soon')
      return
    }
    
    setIsSearching(true)
    setSearchError('')
    
    try {
      // First try cached search for fast results
      const cachedResponse = await fetch(`/api/charities/cached?q=${encodeURIComponent(query)}&limit=10`)
      const cachedData = await cachedResponse.json()
      
      if (cachedData.success && cachedData.data && cachedData.data.searchResults.length > 0) {
        setSearchResults(cachedData.data.searchResults)
        setShowDropdown(true)
        setIsSearching(false)
        return
      }
      
      // If no cached results, fall back to live JustGiving API search
      console.log('No cached results found, searching JustGiving API...')
      const liveResponse = await fetch(`/api/charities/search?q=${encodeURIComponent(query)}&maxResults=10`)
      const liveData = await liveResponse.json()
      
      if (liveData.success && liveData.data) {
        setSearchResults(liveData.data.searchResults || [])
        setShowDropdown(true)
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

  const handleCharitySelect = (charity: JustGivingCharity) => {
    // Check if already selected
    if (selectedCharities.some(c => c.justgiving_charity_id === charity.charityId.toString())) {
      return
    }

    // Check max limit
    if (selectedCharities.length >= maxCharities) {
      return
    }

    const newCharity: SelectedCharity = {
      justgiving_charity_id: charity.charityId.toString(),
      name: charity.name,
      description: charity.description,
      logo_url: charity.logoAbsoluteUrl
    }

    onCharitiesChange([...selectedCharities, newCharity])
    setSearchTerm('')
    setShowDropdown(false)
  }

  const handleCharityRemove = (charityId: string) => {
    if (disabled) return
    onCharitiesChange(selectedCharities.filter(c => c.justgiving_charity_id !== charityId))
  }

  const isCharitySelected = (charityId: number) => {
    return selectedCharities.some(c => c.justgiving_charity_id === charityId.toString())
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
            placeholder={platform === 'justgiving' 
              ? "Search for charities (e.g., 'cancer', 'children', 'environment')" 
              : "Every.org integration coming soon..."}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
            disabled={disabled || platform !== 'justgiving'}
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Search Dropdown */}
        {showDropdown && !disabled && platform === 'justgiving' && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {searchError ? (
              <div className="p-4 text-red-600 text-sm">{searchError}</div>
            ) : searchResults.length === 0 && searchTerm.length >= 2 ? (
              <div className="p-4 text-gray-500 text-sm">
                {isSearching ? 'Searching...' : 'No charities found. Try different keywords.'}
              </div>
            ) : (
              searchResults.map((charity) => {
                const isSelected = isCharitySelected(charity.charityId)
                const isMaxReached = selectedCharities.length >= maxCharities
                const canSelect = !isSelected && !isMaxReached
                
                return (
                  <div
                    key={charity.charityId}
                    onClick={() => canSelect && handleCharitySelect(charity)}
                    className={`flex items-start space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                      isSelected ? 'bg-blue-50' : ''
                    } ${!canSelect ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {charity.logoAbsoluteUrl && (
                      <img
                        src={charity.logoAbsoluteUrl}
                        alt={charity.name}
                        className="w-12 h-12 object-contain rounded flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900 truncate">{charity.name}</h4>
                        {isSelected && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 break-words" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>{charity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {charity.charityId}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Selection Limit Info */}
      {maxCharities > 1 && (
        <div className="text-sm text-gray-500">
          {selectedCharities.length}/{maxCharities} charities selected
          {selectedCharities.length >= maxCharities && (
            <span className="text-orange-600 ml-2">Maximum reached</span>
          )}
        </div>
      )}

      {/* Selected Charities */}
      {selectedCharities.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Selected Charities:</h4>
          <div className="space-y-2">
            {selectedCharities.map((charity) => (
              <div
                key={charity.justgiving_charity_id}
                className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                {charity.logo_url && (
                  <img
                    src={charity.logo_url}
                    alt={charity.name}
                    className="w-10 h-10 object-contain rounded flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900 truncate">{charity.name}</h4>
                    <a
                      href={`https://www.justgiving.com/charity/${charity.justgiving_charity_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="View on JustGiving"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  {charity.description && (
                    <p className="text-sm text-gray-600 truncate">{charity.description}</p>
                  )}
                </div>
                {!disabled && (
                  <button
                    onClick={() => handleCharityRemove(charity.justgiving_charity_id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Remove charity"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}