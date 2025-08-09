'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ExternalLink, Heart, Shield, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import CharitySearchModal from './CharitySearchModal'
import ServicePrice from './ServicePrice'
import { CurrencyCode } from '@/types/database'

interface ServiceDonationFlowProps {
  service: {
    id: string
    title: string
    donation_amount: number
    pricing_tier_id?: number
    charity_requirement_type: 'any_charity' | 'specific_charities'
    preferred_charities: Array<{
      charity_id: string
      name: string
      description?: string
      logo_url?: string
    }> | null
    fundraiser: {
      id: string
      name: string
    }
  }
  userCurrency: CurrencyCode
  isAvailable: boolean
  isFull: boolean
}

interface SelectedCharityOption {
  charity_id: string
  name: string
  description?: string
  logo_url?: string
}

export default function ServiceDonationFlow({ 
  service, 
  userCurrency,
  isAvailable, 
  isFull 
}: ServiceDonationFlowProps) {
  const { user } = useAuth()
  const [selectedCharity, setSelectedCharity] = useState<SelectedCharityOption | null>(null)
  const [isGeneratingUrl, setIsGeneratingUrl] = useState(false)
  const [error, setError] = useState('')
  const [showCharitySelection, setShowCharitySelection] = useState(false)
  const [showCharitySearch, setShowCharitySearch] = useState(false)

  // Auto-select first charity if only one option
  useEffect(() => {
    if (service.charity_requirement_type === 'specific_charities' && 
        service.preferred_charities && 
        service.preferred_charities.length === 1) {
      setSelectedCharity(service.preferred_charities[0])
    }
  }, [service])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const handleSupportService = async () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname)
      window.location.href = `/login?returnUrl=${returnUrl}`
      return
    }

    // Show charity search/selection if needed
    if (service.charity_requirement_type === 'any_charity') {
      setShowCharitySearch(true)
      return
    }

    // For specific charities, either show selection or proceed
    if (service.preferred_charities && service.preferred_charities.length > 1 && !selectedCharity) {
      setShowCharitySelection(true)
      return
    }

    // Proceed with donation
    await generateDonationUrl()
  }

  const generateDonationUrl = async (charityId?: string) => {
    setIsGeneratingUrl(true)
    setError('')

    try {
      const targetCharityId = charityId || selectedCharity?.charity_id
      
      console.log('🔍 Debug info:', {
        charityId,
        selectedCharity,
        targetCharityId,
        serviceId: service.id,
        userId: user?.id,
        donationAmount: service.donation_amount
      })
      
      if (!targetCharityId) {
        throw new Error('Please select a charity to continue')
      }

      // Use new platform-specific API endpoint for JustGiving
      const apiUrl = `/api/just-giving/charity/${targetCharityId}`
      const requestBody = {
        serviceId: service.id,
        donorId: user?.id,
        fundraiserId: service.fundraiser.id,
        donationAmount: service.donation_amount,
        locale: 'en' // TODO: Get from user preferences
      }
      
      console.log('🚀 Making API request:', { apiUrl, requestBody })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📡 API response status:', response.status)
      const data = await response.json()
      console.log('📄 API response data:', data)

      if (data.success) {
        console.log('✅ Service request created:', data.data.referenceId)
        console.log('✅ Redirecting to:', data.data.donationUrl)
        // Open JustGiving donation page in same window
        window.location.href = data.data.donationUrl
      } else {
        throw new Error(data.error || 'Failed to create service request')
      }
    } catch (err) {
      console.error('❌ Donation URL generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate donation URL')
    } finally {
      setIsGeneratingUrl(false)
    }
  }

  const fetchCharityAndProceed = async (charityId: string) => {
    setIsGeneratingUrl(true)
    setError('')

    console.log('🔍 fetchCharityAndProceed called with charityId:', charityId)

    try {
      // Fetch charity details to show in selected charity display
      const apiUrl = `/api/charities/${charityId}`
      console.log('📡 Fetching charity details from:', apiUrl)
      
      const response = await fetch(apiUrl)
      const data = await response.json()
      
      console.log('📄 Charity API response:', data)

      if (data.success) {
        const charityDetails: SelectedCharityOption = {
          charity_id: charityId,
          name: data.data.name,
          description: data.data.description,
          logo_url: data.data.logo_url
        }
        
        setSelectedCharity(charityDetails)
        console.log('🎯 Selected charity set:', charityDetails)
        
        // Small delay to show the selected charity, then proceed
        setTimeout(() => {
          generateDonationUrl(charityId)
        }, 1000)
      } else {
        // If we can't fetch charity details, just proceed with the donation
        console.warn('Could not fetch charity details, proceeding anyway. Error:', data.error)
        generateDonationUrl(charityId)
      }
    } catch (err) {
      console.warn('Error fetching charity details, proceeding anyway:', err)
      generateDonationUrl(charityId)
    }
  }

  const handleCharitySelect = (charity: SelectedCharityOption) => {
    console.log('🎯 Specific charity selected:', charity)
    setSelectedCharity(charity)
    setShowCharitySelection(false)
    
    // Automatically proceed with donation after selection
    setTimeout(() => {
      console.log('⏰ Proceeding with donation for charity:', charity.charity_id)
      generateDonationUrl(charity.charity_id)
    }, 1000)
  }

  const isButtonDisabled = !isAvailable || isFull || isGeneratingUrl

  return (
    <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 p-6 sticky top-8">
      {/* Donation Amount Header */}
      <div className="text-center mb-6">
        <ServicePrice
          pricingTierId={service.pricing_tier_id}
          userCurrency={userCurrency}
          className="text-3xl font-bold text-green-600 mb-2 block"
          showTierName={false}
        />
        <div className="text-sm text-gray-600">
          Fixed donation amount
        </div>
      </div>

      {/* Service Status and Info */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Charity choice:</span>
          <span className="font-medium">
            {service.charity_requirement_type === 'any_charity' ? 'Your choice' : 'Fundraiser selected'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Payment via:</span>
          <span className="font-medium">JustGiving</span>
        </div>
        
        {/* Selected Charity Display */}
        {selectedCharity && (
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="flex items-center space-x-3">
              {selectedCharity.logo_url && (
                <img
                  src={selectedCharity.logo_url}
                  alt={selectedCharity.name}
                  className="w-8 h-8 object-contain rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {selectedCharity.name}
                </div>
                <div className="text-xs text-gray-500">Selected charity</div>
              </div>
              <button
                onClick={() => setShowCharitySelection(true)}
                className="text-blue-600 hover:text-blue-800 text-xs"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-4">
          {error}
        </div>
      )}

      {/* Charity Search Modal (for any charity services) */}
      <CharitySearchModal
        isOpen={showCharitySearch}
        onClose={() => setShowCharitySearch(false)}
        onCharitySelect={(charityId) => {
          setShowCharitySearch(false)
          // For any charity mode, we need to fetch charity details first to show selected charity
          fetchCharityAndProceed(charityId)
        }}
        donationAmount={service.donation_amount}
      />

      {/* Specific Charity Selection Modal */}
      {showCharitySelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Choose Your Preferred Charity
              </h3>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  This fundraiser has selected these preferred charities:
                </p>
                
                {service.preferred_charities?.map((charity) => (
                  <button
                    key={charity.charity_id}
                    onClick={() => {
                      console.log('🖱️ Clicked charity button:', charity)
                      handleCharitySelect(charity)
                    }}
                    className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-3">
                      {charity.logo_url && (
                        <img
                          src={charity.logo_url}
                          alt={charity.name}
                          className="w-10 h-10 object-contain rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{charity.name}</div>
                        {charity.description && (
                          <div className="text-sm text-gray-600 truncate">
                            {charity.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowCharitySelection(false)}
                className="mt-4 w-full px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Action Button */}
      <button 
        onClick={handleSupportService}
        className={`w-full py-3 px-4 rounded-md font-medium text-white ${
          isButtonDisabled
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700'
        } transition-colors`}
        disabled={isButtonDisabled}
      >
        {isGeneratingUrl ? (
          'Redirecting to JustGiving...'
        ) : !user ? (
          'Login to Support This Service'
        ) : !isAvailable ? (
          'Not Yet Available'
        ) : isFull ? (
          'Currently Full'
        ) : (
          'Support This Service'
        )}
      </button>

      {/* Trust Indicators */}
      <div className="mt-4 space-y-2">
        <p className="text-xs text-gray-500 text-center">
          100% of your donation goes directly to charity via JustGiving
        </p>
        
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center">
            <Shield className="h-3 w-3 mr-1" />
            Secure
          </div>
          <div className="flex items-center">
            <Heart className="h-3 w-3 mr-1" />
            Verified Charities
          </div>
          <div className="flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" />
            Instant Receipt
          </div>
        </div>
      </div>

      {/* Authentication Required Notice */}
      {!user && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-xs text-blue-800 text-center">
            <Link href="/signup" className="font-medium hover:underline">
              Create account
            </Link> or{' '}
            <Link href="/login" className="font-medium hover:underline">
              login
            </Link> to connect with the fundraiser after your donation
          </p>
        </div>
      )}
    </div>
  )
}