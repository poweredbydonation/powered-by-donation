'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'

interface DeleteUserProfileProps {
  user: User
  onDeleted?: () => void
}

export default function DeleteUserProfile({ user, onDeleted }: DeleteUserProfileProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check for dependencies that would prevent deletion
      if (user.is_provider) {
        // Check if user has active services
        const { data: services } = await supabase
          .from('services')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (services && services.length > 0) {
          setError('You cannot delete your profile while you have active services. Please deactivate all services first.')
          return
        }
      }

      if (user.is_supporter) {
        // Check if user has active service requests
        const { data: requests } = await supabase
          .from('service_requests')
          .select('id')
          .eq('supporter_id', user.id)
          .neq('status', 'success')

        if (requests && requests.length > 0) {
          setError('You cannot delete your profile while you have active service requests or pending donations. Contact support if you need assistance.')
          return
        }
      }

      // Delete user profile (cascading will handle related records)
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id)

      if (deleteError) {
        throw deleteError
      }

      // Sign out the user after successful deletion
      await supabase.auth.signOut()
      
      onDeleted?.()

    } catch (err: any) {
      console.error('Profile deletion error:', err)
      setError(err.message || 'Failed to delete profile')
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  if (!showConfirmation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-2">Delete Profile</h3>
        <p className="text-red-700 mb-4">
          This will permanently delete your profile and all associated data. This action cannot be undone.
        </p>
        
        {user.is_provider && (
          <p className="text-red-600 text-sm mb-2">
            ⚠️ As a provider, this will also delete all your services and service history.
          </p>
        )}
        
        {user.is_supporter && (
          <p className="text-red-600 text-sm mb-4">
            ⚠️ As a supporter, this will delete your donation history and service requests.
          </p>
        )}

        <button
          onClick={() => setShowConfirmation(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Delete Profile
        </button>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-6">
      <h3 className="text-lg font-semibold text-red-900 mb-4">Confirm Profile Deletion</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <p className="text-red-700 mb-6">
        Are you sure you want to delete your profile for "{user.name}"? 
        This action is permanent and will:
      </p>
      
      <ul className="text-red-600 text-sm mb-6 space-y-1">
        <li>• Delete your profile information</li>
        {user.is_provider && <li>• Remove all your services</li>}
        {user.is_supporter && <li>• Delete your donation history</li>}
        <li>• Sign you out of the platform</li>
        <li>• Cannot be undone</li>
      </ul>

      <div className="flex space-x-4">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Deleting...' : 'Yes, Delete My Profile'}
        </button>
        
        <button
          onClick={() => setShowConfirmation(false)}
          disabled={loading}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}