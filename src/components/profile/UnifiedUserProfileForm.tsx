'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

interface UnifiedUserProfileFormProps {
  user: any // Supabase Auth User
  existingProfile?: User | null
  onProfileCreated?: () => void
}

export default function UnifiedUserProfileForm({ user, existingProfile, onProfileCreated }: UnifiedUserProfileFormProps) {
  // Form state
  const [name, setName] = useState(existingProfile?.name || '')
  const [username, setUsername] = useState(existingProfile?.username || '')
  const [bio, setBio] = useState(existingProfile?.bio || '')
  const [location, setLocation] = useState(existingProfile?.location || '')
  const [phone, setPhone] = useState(existingProfile?.phone || '')
  const [avatarUrl, setAvatarUrl] = useState(existingProfile?.avatar_url || '')
  
  // Role toggles
  const [isProvider, setIsProvider] = useState(existingProfile?.is_provider || false)
  const [isSupporter, setIsSupporter] = useState(existingProfile?.is_supporter ?? true)
  
  // Form state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate required fields
      if (!name.trim()) {
        throw new Error('Name is required')
      }

      // Ensure user has at least one role
      if (!isProvider && !isSupporter) {
        throw new Error('You must be either a provider, supporter, or both')
      }

      const profileData = {
        id: user.id,
        email: user.email,
        name: name.trim(),
        username: username.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        is_provider: isProvider,
        is_supporter: isSupporter
      }

      let result
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('users')
          .update(profileData)
          .eq('id', user.id)
      } else {
        // Create new profile
        result = await supabase
          .from('users')
          .insert(profileData)
      }

      if (result.error) {
        throw result.error
      }

      setSuccess(existingProfile ? 'Profile updated successfully!' : 'Profile created successfully!')
      
      if (onProfileCreated) {
        onProfileCreated()
      } else if (!existingProfile) {
        // If creating a new profile and no callback provided, redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard')
        }, 1500)
      } else {
        // If updating existing profile and no callback provided, refresh the page
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      }

    } catch (err: any) {
      console.error('Profile operation error:', err)
      setError(err.message || 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {existingProfile ? 'Update Your Profile' : 'Create Your Profile'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
          <div className="text-green-800">{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Role Selection */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Your Role(s)</h3>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isProvider}
                onChange={(e) => setIsProvider(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Service Provider</span>
                <p className="text-sm text-gray-600">Offer services and help charities</p>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isSupporter}
                onChange={(e) => setIsSupporter(e.target.checked)}
                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div>
                <span className="font-medium text-gray-900">Supporter</span>
                <p className="text-sm text-gray-600">Find services and make charitable donations</p>
              </div>
            </label>
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your full name"
            required
          />
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username (Optional)
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Choose a unique username"
          />
          <p className="text-sm text-gray-500 mt-1">For public profile URL (optional)</p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Tell others about yourself and your interests..."
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="City, State/Country"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Your phone number"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : (existingProfile ? 'Update Profile' : 'Create Profile')}
          </button>
        </div>
      </form>
    </div>
  )
}