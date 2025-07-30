'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { CharityRequirementType, ServiceLocation } from '@/types/database'
import CharitySelector from './CharitySelector'

interface SelectedCharity {
  justgiving_charity_id: string
  name: string
  description?: string
  logo_url?: string
}

export default function ServiceCreationForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [donationAmount, setDonationAmount] = useState('')
  const [charityRequirementType, setCharityRequirementType] = useState<CharityRequirementType>('any_charity')
  const [selectedCharities, setSelectedCharities] = useState<SelectedCharity[]>([])
  const [availableFrom, setAvailableFrom] = useState('')
  const [availableUntil, setAvailableUntil] = useState('')
  const [maxSupporters, setMaxSupporters] = useState('')
  
  // Location handling
  const [locationType, setLocationType] = useState<'remote' | 'physical' | 'hybrid'>('remote')
  const [address, setAddress] = useState('')
  const [area, setArea] = useState('')
  const [radius, setRadius] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const { user } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    
    setLoading(true)
    setError(null)

    try {
      // Validate charity requirements
      if (charityRequirementType === 'specific_charities' && selectedCharities.length === 0) {
        throw new Error('Please select at least one charity when using specific charity requirements.')
      }

      // Check if user has provider role
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, is_provider')
        .eq('id', user.id)
        .single()

      if (userError || !userData) {
        throw new Error('User profile not found. Please complete your profile setup first.')
      }

      if (!userData.is_provider) {
        throw new Error('You need to enable your provider role to create services. Please update your profile first.')
      }

      // Build service location object
      const serviceLocation: ServiceLocation = {
        type: locationType,
        ...(locationType !== 'remote' && address && { address }),
        ...(locationType !== 'remote' && area && { area }),
        ...(locationType !== 'remote' && radius && { radius: parseInt(radius) }),
      }

      // Prepare preferred charities data
      const preferredCharities = charityRequirementType === 'specific_charities' 
        ? selectedCharities.map(charity => ({
            charity_id: charity.justgiving_charity_id,
            name: charity.name,
            description: charity.description,
            logo_url: charity.logo_url
          }))
        : []

      // Prepare service data
      const serviceData = {
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        donation_amount: parseFloat(donationAmount),
        charity_requirement_type: charityRequirementType,
        preferred_charities: preferredCharities.length > 0 ? preferredCharities : null,
        available_from: availableFrom,
        available_until: availableUntil || null,
        max_supporters: maxSupporters ? parseInt(maxSupporters) : null,
        service_locations: [serviceLocation],
        show_in_directory: true,
        is_active: true,
      }

      const { error: insertError } = await supabase
        .from('services')
        .insert([serviceData])

      if (insertError) {
        throw insertError
      }

      // Redirect to services dashboard
      router.push('/dashboard/services')
    } catch (err) {
      console.error('Service creation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create service')
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

        <div>
          <label htmlFor="donationAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Fixed Donation Amount (AUD) *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              id="donationAmount"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50"
              min="1"
              step="0.01"
              required
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Supporters will donate exactly this amount to their chosen charity
          </p>
        </div>
      </div>

      {/* Charity Requirements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Charity Requirements</h3>
        
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
              <div className="text-sm text-gray-500">Supporters can donate to any registered charity</div>
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
              <div className="text-sm text-gray-500">Choose which charities supporters can donate to</div>
            </div>
          </label>
        </div>

        {/* Charity Selector */}
        {charityRequirementType === 'specific_charities' && (
          <div className="pl-6 border-l-2 border-gray-200 space-y-4">
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-2">Select Preferred Charities</h4>
              <p className="text-sm text-gray-600 mb-4">
                Search and select up to 5 charities that supporters can choose from. 
                All charities are verified JustGiving registered charities.
              </p>
              
              <CharitySelector
                selectedCharities={selectedCharities}
                onCharitiesChange={setSelectedCharities}
                maxCharities={5}
                disabled={loading}
              />
              
              {charityRequirementType === 'specific_charities' && selectedCharities.length === 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    Please select at least one charity for supporters to donate to.
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

        {/* Physical location fields */}
        {(locationType === 'physical' || locationType === 'hybrid') && (
          <div className="space-y-4 pl-6 border-l-2 border-gray-200">
            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-1">
                Service Area
              </label>
              <input
                type="text"
                id="area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Sydney CBD, Melbourne Eastern Suburbs"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Main St, Sydney NSW"
              />
            </div>

            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                Service Radius (km)
              </label>
              <input
                type="number"
                id="radius"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
                min="1"
              />
            </div>
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
          <label htmlFor="maxSupporters" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Supporters (Optional)
          </label>
          <input
            type="number"
            id="maxSupporters"
            value={maxSupporters}
            onChange={(e) => setMaxSupporters(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Leave empty for unlimited"
            min="1"
          />
          <p className="text-sm text-gray-500 mt-1">
            Limit how many supporters can use this service
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
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Service'}
        </button>
      </div>
    </form>
  )
}