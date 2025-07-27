'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'

export default function ProviderSetupForm() {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [showBio, setShowBio] = useState(true)
  const [showContact, setShowContact] = useState(false)
  const [showInDirectory, setShowInDirectory] = useState(false)
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
      const { error: insertError } = await supabase
        .from('providers')
        .insert({
          id: user.id,
          name: name.trim(),
          bio: bio.trim() || null,
          show_bio: showBio,
          show_contact: showContact,
          show_in_directory: showInDirectory
        })

      if (insertError) {
        throw insertError
      }

      // Force reload to ensure fresh data is displayed
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Failed to create provider profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Provider Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your name or business name"
        />
        <p className="mt-1 text-sm text-gray-500">
          This will be displayed to potential supporters
        </p>
      </div>

      {/* Bio Field */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          Bio (Optional)
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell supporters about yourself and your services..."
        />
        <p className="mt-1 text-sm text-gray-500">
          {bio.length}/500 characters
        </p>
      </div>

      {/* Privacy Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
        
        <div className="space-y-4">
          <div className="flex items-center">
            <input
              id="show_bio"
              type="checkbox"
              checked={showBio}
              onChange={(e) => setShowBio(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show_bio" className="ml-2 block text-sm text-gray-700">
              Show bio publicly
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="show_contact"
              type="checkbox"
              checked={showContact}
              onChange={(e) => setShowContact(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show_contact" className="ml-2 block text-sm text-gray-700">
              Show contact information to supporters
            </label>
          </div>

          <div className="flex items-center">
            <input
              id="show_in_directory"
              type="checkbox"
              checked={showInDirectory}
              onChange={(e) => setShowInDirectory(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="show_in_directory" className="ml-2 block text-sm text-gray-700">
              List me in provider directory
            </label>
          </div>
        </div>
        
        <p className="mt-3 text-sm text-gray-500">
          You can change these settings later from your dashboard
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Profile...' : 'Create Provider Profile'}
        </button>
      </div>
    </form>
  )
}