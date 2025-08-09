'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { CharityRequirementType, ServiceLocation, Service, PricingTier, CurrencyCode, DonationPlatform } from '@/types/database'
import CharitySelector from './CharitySelector'
import ServiceLocationPicker from '@/components/ServiceLocationPicker'
import PricingTierSlider from '@/components/forms/PricingTierSlider'

interface SelectedCharity {
  justgiving_charity_id: string
  name: string
  description?: string
  logo_url?: string
}

interface ServiceCreationFormProps {
  initialData?: Service
  onSuccess?: () => void
  mode?: 'create' | 'edit'
}

export default function ServiceCreationForm({ 
  initialData, 
  onSuccess, 
  mode = 'create' 
}: ServiceCreationFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [selectedTier, setSelectedTier] = useState<PricingTier | null>(null)
  const [userCurrency, setUserCurrency] = useState<CurrencyCode>('GBP')
  const [userPlatform, setUserPlatform] = useState<DonationPlatform>('justgiving')
  const [charityRequirementType, setCharityRequirementType] = useState<CharityRequirementType>('any_charity')
  const [selectedCharities, setSelectedCharities] = useState<SelectedCharity[]>([])
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [maxDonors, setMaxDonors] = useState('')
  
  // Location handling
  const [locationType, setLocationType] = useState<'remote' | 'physical' | 'hybrid'>('remote')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [radius, setRadius] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  // Helper function to get price for user's currency
  const getTierPrice = (tier: PricingTier, currency: CurrencyCode): number => {
    switch (currency) {
      case 'GBP': return tier.price_gbp
      case 'USD': return tier.price_usd
      case 'CAD': return tier.price_cad
      case 'AUD': return tier.price_aud
      case 'EUR': return tier.price_eur
      default: return tier.price_gbp
    }
  }

  // Fetch user's preferred currency and platform
  useEffect(() => {
    const fetchUserPreferences = async () => {
      if (!user) return
      
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('preferred_currency, preferred_platform')
          .eq('id', user.id)
          .single()
        
        if (userProfile?.preferred_currency) {
          setUserCurrency(userProfile.preferred_currency)
        }
        if (userProfile?.preferred_platform) {
          setUserPlatform(userProfile.preferred_platform)
        }
      } catch (err) {
        console.error('Error fetching user preferences:', err)
      }
    }

    fetchUserPreferences()
  }, [user, supabase])

  // Initialize form with existing data when in edit mode
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setTitle(initialData.title || '')
      setDescription(initialData.description || '')
      setCharityRequirementType(initialData.charity_requirement_type || 'any_charity')
      
      // Set selected tier if available
      if (initialData.pricing_tier_id) {
        // The tier will be set when pricing tiers are loaded in PricingTierSlider
        // We'll need to enhance PricingTierSlider to handle initial selection
      }
      
      // Handle dates
      if (initialData.available_from) {
        setAvailableFrom(new Date(initialData.available_from).toISOString().split('T')[0])
      }
      if (initialData.available_until) {
        setAvailableUntil(new Date(initialData.available_until).toISOString().split('T')[0])
      }
      if (initialData.max_donors) {
        setMaxDonors(initialData.max_donors.toString())
      }

      // Handle preferred charities
      if (initialData.preferred_charities && Array.isArray(initialData.preferred_charities)) {
        setSelectedCharities(initialData.preferred_charities as SelectedCharity[])
      }

      // Handle service locations
      if (initialData.service_locations && Array.isArray(initialData.service_locations)) {
        const locations = initialData.service_locations as ServiceLocation[]
        if (locations.length > 0) {
          const firstLocation = locations[0]
          setLocationType(firstLocation.type || 'remote')
          setAddress(firstLocation.address || '')
          setArea(firstLocation.area || '')
          setRadius(firstLocation.radius?.toString() || '')
          if (firstLocation.latitude) setLatitude(firstLocation.latitude)
          if (firstLocation.longitude) setLongitude(firstLocation.longitude)
        }
      }
    }
  }, [initialData, mode])

  // Handle location picker changes
  const handleLocationChange = (location: { lat: number; lng: number }, newRadius: number, newAddress?: string) => {
    setLatitude(location.lat)
    setLongitude(location.lng)
    setRadius(newRadius.toString())
    if (newAddress) {
      setAddress(newAddress)
      setArea(newAddress) // Use address as area for now
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError(null)

    try {
      // Validate platform availability
      if (userPlatform === 'every_org') {
        throw new Error('Every.org integration is coming soon. Please switch to JustGiving in your profile settings to create services.')
      }

      // Validate pricing tier selection
      if (!selectedTier) {
        throw new Error('Please select a pricing tier for your service.')
      }

      // Validate charity requirements
      if (charityRequirementType === 'specific_charities' && selectedCharities.length === 0) {
        throw new Error('Please select at least one charity when using specific charity requirements.')
      }

      // Check if user has fundraiser role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, is_fundraiser')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        throw new Error('User profile not found. Please complete your profile setup first.')
      }

      if (!userData.is_fundraiser) {
        throw new Error('You need to enable your fundraiser role to create services. Please update your profile first.')
      }

      // Build service location object
      const serviceLocation: ServiceLocation = {
        type: locationType,
        ...(locationType !== 'remote' && address && { address }),
        ...(locationType !== 'remote' && area && { area }),
        ...(locationType !== 'remote' && radius && { radius: parseInt(radius) }),
        ...(locationType !== 'remote' && latitude && { latitude }),
        ...(locationType !== 'remote' && longitude && { longitude }),
      }

      // Prepare preferred charities data and organization info
      const preferredCharities = charityRequirementType === 'specific_charities' 
        ? selectedCharities.map(charity => ({
            charity_id: charity.justgiving_charity_id,
            name: charity.name,
            description: charity.description,
            logo_url: charity.logo_url
          }))
        : []

      // Determine organization name and data based on charity requirements
      const organizationName = charityRequirementType === 'specific_charities' && selectedCharities.length === 1
        ? selectedCharities[0].name
        : charityRequirementType === 'specific_charities' && selectedCharities.length > 1
        ? `${selectedCharities.length} selected charities`
        : charityRequirementType === 'any_charity'
        ? 'Any JustGiving charity'
        : null

      const organizationData = charityRequirementType === 'specific_charities' && selectedCharities.length > 0
        ? {
            type: 'specific_charities',
            platform: userPlatform,
            charities: preferredCharities,
            count: selectedCharities.length
          }
        : charityRequirementType === 'any_charity'
        ? {
            type: 'any_charity', 
            platform: userPlatform
          }
        : null

      // Prepare service data
      const serviceData = {
        ...(mode === 'create' && { user_id: user.id }),
        title: title.trim(),
        description: description.trim() || null,
        donation_amount: selectedTier ? selectedTier.price_aud : 0, // Always store AUD amount
        pricing_tier_id: selectedTier ? selectedTier.id : null,
        charity_requirement_type: charityRequirementType,
        preferred_charities: preferredCharities.length > 0 ? preferredCharities : null,
        available_from: availableFrom,
        available_until: availableUntil || null,
        max_donors: maxDonors ? parseInt(maxDonors) : null,
        service_locations: [serviceLocation],
        // Platform-specific fields
        platform: userPlatform,
        organization_name: organizationName,
        organization_data: organizationData,
        ...(mode === 'create' && { 
          show_in_directory: true,
          is_active: true 
        }),
      }

      if (mode === 'edit' && initialData) {
        // Update existing service
        const { error: updateError } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', initialData.id)
          .eq('user_id', user.id) // Ensure user owns this service

        if (updateError) {
          throw updateError
        }
      } else {
        // Create new service
        const { error: insertError } = await supabase
          .from('services')
          .insert([serviceData])

        if (insertError) {
          throw insertError
        }
      }

      // Call success callback or redirect
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/dashboard/services')
      }
    } catch (err) {
      console.error(`Service ${mode} error:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${mode} service`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Basic Service Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Service Details</h3>
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Service Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Professional Website Design"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your service offering..."
          />
        </div>

        <PricingTierSlider
          selectedTierId={selectedTier?.id || null}
          onTierSelect={setSelectedTier}
          userCurrency={userCurrency}
          className="mb-6"
        />
      </div>

      {/* Charity Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Charity Requirements</h3>
        
        {userPlatform === 'every_org' ? (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">Every.org Integration Coming Soon</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Every.org nonprofit support is currently in development. You can switch to JustGiving in your profile settings to create services now.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="charityRequirement"
                value="any_charity"
                checked={charityRequirementType === 'any_charity'}
                onChange={(e) => {
                  setCharityRequirementType(e.target.value as CharityRequirementType)
                  if (e.target.value === 'any_charity') {
                    setSelectedCharities([])
                  }
                }}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Any JustGiving Charity</div>
                <div className="text-sm text-gray-500">Donors can donate to any registered charity</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="charityRequirement"
                value="specific_charities"
                checked={charityRequirementType === 'specific_charities'}
                onChange={(e) => setCharityRequirementType(e.target.value as CharityRequirementType)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Specific Charities</div>
                <div className="text-sm text-gray-500">Choose which charities donors can donate to</div>
              </div>
            </label>
          </div>
        )}

        {/* Charity Selector */}
        {charityRequirementType === 'specific_charities' && userPlatform === 'justgiving' && (
          <div className="pl-6 border-l-2 border-gray-200 space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Select Preferred Charities</h4>
              <p className="text-sm text-gray-600 mb-4">
                Search and select up to 5 charities that donors can choose from. 
                All charities are verified JustGiving registered charities.
              </p>
              
              <CharitySelector
                selectedCharities={selectedCharities}
                onCharitiesChange={setSelectedCharities}
                maxCharities={5}
                disabled={loading}
                platform={userPlatform}
              />
              
              {charityRequirementType === 'specific_charities' && selectedCharities.length === 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Please select at least one charity for donors to donate to.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Location Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Service Location</h3>
        
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="locationType"
              value="remote"
              checked={locationType === 'remote'}
              onChange={(e) => setLocationType(e.target.value as 'remote' | 'physical' | 'hybrid')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Remote Service</div>
              <div className="text-sm text-gray-500">Online delivery via video calls, email, etc.</div>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="locationType"
              value="physical"
              checked={locationType === 'physical'}
              onChange={(e) => setLocationType(e.target.value as 'remote' | 'physical' | 'hybrid')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Physical Location</div>
              <div className="text-sm text-gray-500">In-person service at a specific location</div>
            </div>
          </label>
          
          <label className="flex items-center">
            <input
              type="radio"
              name="locationType"
              value="hybrid"
              checked={locationType === 'hybrid'}
              onChange={(e) => setLocationType(e.target.value as 'remote' | 'physical' | 'hybrid')}
              className="mr-3"
            />
            <div>
              <div className="font-medium">Hybrid Service</div>
              <div className="text-sm text-gray-500">Both remote and in-person options available</div>
            </div>
          </label>
        </div>

        {/* Physical location picker */}
        {(locationType === 'physical' || locationType === 'hybrid') && (
          <div className="pl-6 border-l-2 border-gray-200">
            <ServiceLocationPicker
              initialLocation={
                latitude && longitude 
                  ? { lat: latitude, lng: longitude }
                  : undefined
              }
              initialRadius={radius ? parseInt(radius) : undefined}
              onLocationChange={handleLocationChange}
              className="mt-4"
            />
          </div>
        )}
      </div>

      {/* Availability */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Availability</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="availableFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Available From *
            </label>
            <input
              type="date"
              id="availableFrom"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="availableUntil" className="block text-sm font-medium text-gray-700 mb-1">
              Available Until (Optional)
            </label>
            <input
              type="date"
              id="availableUntil"
              value={availableUntil}
              onChange={(e) => setAvailableUntil(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="maxDonors" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Donors (Optional)
          </label>
          <input
            type="number"
            id="maxDonors"
            value={maxDonors}
            onChange={(e) => setMaxDonors(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave empty for unlimited"
            min="1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Limit how many donors can use this service
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || userPlatform === 'every_org'}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading 
            ? (mode === 'edit' ? 'Updating...' : 'Creating...') 
            : userPlatform === 'every_org'
            ? 'Every.org Coming Soon'
            : (mode === 'edit' ? 'Update Service' : 'Create Service')
          }
        </button>
      </div>
    </form>
  )
}