'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'

interface PopulationResult {
  searchResults?: number
  priorityResults?: number
  totalCharities: number
  errors: string[]
}

export default function TestCharityCachePage() {
  const [isPopulating, setIsPopulating] = useState(false)
  const [populationResult, setPopulationResult] = useState<PopulationResult | null>(null)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searchTime, setSearchTime] = useState<number | null>(null)

  const populateCache = async (mode: 'essential' | 'full') => {
    setIsPopulating(true)
    setError('')
    setPopulationResult(null)

    try {
      const response = await fetch('/api/charities/populate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode })
      })

      const data = await response.json()

      if (data.success) {
        setPopulationResult(data.data)
      } else {
        setError(data.error || 'Failed to populate cache')
      }
    } catch (err) {
      console.error('Population error:', err)
      setError('Network error occurred')
    } finally {
      setIsPopulating(false)
    }
  }

  const testCachedSearch = async () => {
    if (!searchTerm.trim()) return

    const startTime = Date.now()
    
    try {
      const response = await fetch(`/api/charities/cached?q=${encodeURIComponent(searchTerm)}&limit=10`)
      const data = await response.json()
      
      const endTime = Date.now()
      setSearchTime(endTime - startTime)

      if (data.success) {
        setSearchResults(data.data.searchResults || [])
      } else {
        setSearchResults([])
        setError(data.error || 'Search failed')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Search network error')
      setSearchResults([])
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Charity Cache Management</h1>
              <p className="text-lg text-gray-600">
                Manage the local charity database cache for fast service creation searches.
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Cache Population */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Populate Charity Cache</h2>
                <p className="text-gray-600 mb-6">
                  Populate the local database with popular charities for fast searching during service creation.
                </p>
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => populateCache('essential')}
                    disabled={isPopulating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isPopulating ? 'Populating...' : 'Populate Essential (~25 charities)'}
                  </button>
                  
                  <button
                    onClick={() => populateCache('full')}
                    disabled={isPopulating}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isPopulating ? 'Populating...' : 'Full Population (~200+ charities)'}
                  </button>
                </div>

                {isPopulating && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800">
                      Population in progress... This may take several minutes as we fetch data from JustGiving API.
                    </p>
                  </div>
                )}

                {populationResult && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-medium text-green-900 mb-2">Population Complete!</h3>
                    <div className="text-sm text-green-800 space-y-1">
                      {populationResult.priorityResults !== undefined && (
                        <div>Priority charities: {populationResult.priorityResults}</div>
                      )}
                      {populationResult.searchResults !== undefined && (
                        <div>Search results: {populationResult.searchResults}</div>
                      )}
                      <div>Total cached charities: {populationResult.totalCharities}</div>
                      <div>Errors: {populationResult.errors.length}</div>
                    </div>
                    
                    {populationResult.errors.length > 0 && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-orange-700">View Errors</summary>
                        <div className="mt-2 text-xs text-orange-600 space-y-1">
                          {populationResult.errors.map((error, index) => (
                            <div key={index}>• {error}</div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Test Cached Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Cached Search</h2>
                <p className="text-gray-600 mb-4">
                  Test the speed of cached charity searches vs live API searches.
                </p>
                
                <div className="flex space-x-4 mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter search term (e.g., 'cancer', 'children')"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && testCachedSearch()}
                  />
                  <button
                    onClick={testCachedSearch}
                    className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Search Cache
                  </button>
                </div>

                {searchTime !== null && (
                  <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
                    <p className="text-purple-800">
                      🚀 Search completed in <strong>{searchTime}ms</strong> - 
                      Found <strong>{searchResults.length}</strong> results
                    </p>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-gray-900">Cached Search Results:</h3>
                    {searchResults.slice(0, 5).map((charity) => (
                      <div key={charity.charityId} className="border border-gray-200 rounded-lg p-3">
                        <div className="flex items-start space-x-3">
                          {charity.logoAbsoluteUrl && (
                            <img
                              src={charity.logoAbsoluteUrl}
                              alt={charity.name}
                              className="w-12 h-12 object-contain rounded"
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900">{charity.name}</h4>
                            <p className="text-sm text-gray-600">ID: {charity.charityId}</p>
                            <p className="text-sm text-gray-700 mt-1">{charity.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-medium text-blue-900 mb-3">How to Use:</h3>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>First, populate the cache with "Essential" for quick testing or "Full" for comprehensive coverage</li>
                <li>Test search speed using the cached search - should be under 50ms for local searches</li>
                <li>Go to `/test-service-creation` to test the improved charity selector performance</li>
                <li>Set up a daily cron job to run population for fresh charity data</li>
              </ol>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}