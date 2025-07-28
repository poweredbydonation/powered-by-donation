'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'

interface CharityResult {
  charityId: number
  name: string
  description: string
  logoAbsoluteUrl?: string
}

interface ApiResponse {
  success: boolean
  data?: {
    searchResults: CharityResult[]
    syncedCount: number
    total: number
  }
  error?: string
}

export default function TestJustGivingPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [charityResults, setCharityResults] = useState<CharityResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [charityId, setCharityId] = useState('')
  const [singleCharityResult, setSingleCharityResult] = useState<any>(null)

  const searchCharities = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search term')
      return
    }

    setLoading(true)
    setError('')
    setCharityResults([])

    try {
      const response = await fetch(`/api/charities/search?q=${encodeURIComponent(searchTerm)}&maxResults=10`)
      const data: ApiResponse = await response.json()

      if (data.success && data.data) {
        setCharityResults(data.data.searchResults)
        console.log(`Found ${data.data.total} charities, synced ${data.data.syncedCount}`)
      } else {
        setError(data.error || 'Failed to search charities')
      }
    } catch (err) {
      console.error('Search error:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getCharityById = async () => {
    if (!charityId.trim()) {
      setError('Please enter a charity ID')
      return
    }

    setLoading(true)
    setError('')
    setSingleCharityResult(null)

    try {
      const response = await fetch(`/api/charities/${charityId}`)
      const data = await response.json()

      if (data.success) {
        setSingleCharityResult(data.data)
      } else {
        setError(data.error || 'Failed to fetch charity')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const generateDonationUrl = async (charityId: number, amount?: number) => {
    try {
      const response = await fetch(`/api/charities/${charityId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'donation-url',
          amount: amount || 50,
          reference: 'PoweredByDonation-Test'
        })
      })

      const data = await response.json()
      if (data.success) {
        window.open(data.data.donationUrl, '_blank')
      } else {
        setError(data.error || 'Failed to generate donation URL')
      }
    } catch (err) {
      console.error('Donation URL error:', err)
      setError('Failed to generate donation URL')
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">JustGiving API Test</h1>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Charity Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Charities</h2>
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Enter charity name (e.g., 'cancer', 'children')"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && searchCharities()}
                  />
                  <button
                    onClick={searchCharities}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>

                {charityResults.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Search Results ({charityResults.length})</h3>
                    {charityResults.map((charity) => (
                      <div key={charity.charityId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {charity.logoAbsoluteUrl && (
                            <img
                              src={charity.logoAbsoluteUrl}
                              alt={charity.name}
                              className="w-16 h-16 object-contain rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{charity.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">ID: {charity.charityId}</p>
                            <p className="text-sm text-gray-700 mt-2">{charity.description}</p>
                            <button
                              onClick={() => generateDonationUrl(charity.charityId)}
                              className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                            >
                              Test Donation ($50)
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Single Charity Fetch Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fetch Single Charity</h2>
                <div className="flex gap-4 mb-4">
                  <input
                    type="text"
                    value={charityId}
                    onChange={(e) => setCharityId(e.target.value)}
                    placeholder="Enter charity ID (e.g., 2050)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && getCharityById()}
                  />
                  <button
                    onClick={getCharityById}
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Fetching...' : 'Fetch'}
                  </button>
                </div>

                {singleCharityResult && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Charity Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><strong>Name:</strong> {singleCharityResult.name}</div>
                      <div><strong>ID:</strong> {singleCharityResult.justgiving_charity_id}</div>
                      <div><strong>Slug:</strong> {singleCharityResult.slug}</div>
                      <div><strong>Category:</strong> {singleCharityResult.category || 'N/A'}</div>
                      <div><strong>Description:</strong> {singleCharityResult.description || 'N/A'}</div>
                      <div><strong>Stats:</strong> {singleCharityResult.total_donations_count} donations, ${singleCharityResult.total_amount_received} raised</div>
                      <div><strong>Last Updated:</strong> {new Date(singleCharityResult.last_updated).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => generateDonationUrl(parseInt(singleCharityResult.justgiving_charity_id))}
                      className="mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Test Donation ($50)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}