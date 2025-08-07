'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface DeleteFundraiserProfileProps {
  fundraiserId: string
  fundraiserName: string
}

export default function DeleteFundraiserProfile({ fundraiserId, fundraiserName }: DeleteFundraiserProfileProps) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if fundraiser has any active services
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('id')
        .eq('user_id', fundraiserId)

      if (servicesError) throw servicesError

      if (services && services.length > 0) {
        setError('You cannot delete your fundraiser profile while you have active services. Please delete all services first.')
        setLoading(false)
        return
      }

      // Update user to remove fundraiser role
      const { error: updateError } = await supabase
        .from('users')
        .update({ is_fundraiser: false })
        .eq('id', fundraiserId)

      if (updateError) throw updateError

      // Show success state
      setLoading(false)
      setSuccess(true)
      
      // Redirect after showing success
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to delete fundraiser profile')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4">
        <p className="text-green-700 font-medium">✓ Fundraiser role removed successfully</p>
        <p className="text-green-600 text-sm">Redirecting to dashboard...</p>
      </div>
    )
  }

  if (!showConfirm) {
    return (
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-800 text-sm font-medium"
      >
        Remove Fundraiser Role
      </button>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <h4 className="text-lg font-medium text-red-900 mb-2">Remove Fundraiser Role</h4>
      <p className="text-red-700 mb-4">
        Are you sure you want to remove your fundraiser role for "{fundraiserName}"? 
        You can re-enable your fundraiser role later if needed.
      </p>
      
      {error && (
        <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex space-x-3">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Updating...' : 'Yes, Remove Fundraiser Role'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}