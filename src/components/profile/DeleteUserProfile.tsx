'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { useTranslations } from 'next-intl'

interface DeleteUserProfileProps {
  user: User
  onDeleted?: () => void
}

export default function DeleteUserProfile({ user, onDeleted }: DeleteUserProfileProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const t = useTranslations('deleteProfile')

  const supabase = createClient()

  const handleDelete = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check for dependencies that would prevent deletion
      if (user.is_fundraiser) {
        // Check if user has active services
        const { data: services } = await supabase
          .from('services')
          .select('id')
          .eq('user_id', user.id)
          .eq('is_active', true)

        if (services && services.length > 0) {
          setError(t('errors.activeServices'))
          return
        }
      }

      if (user.is_donor) {
        // Check if user has active service requests
        const { data: requests } = await supabase
          .from('service_requests')
          .select('id')
          .eq('donor_id', user.id)
          .neq('status', 'success')

        if (requests && requests.length > 0) {
          setError(t('errors.activeRequests'))
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
      setError(err.message || t('errors.deleteFailed'))
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  if (!showConfirmation) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <h3 className="text-lg font-semibold text-red-900 mb-2">{t('title')}</h3>
        <p className="text-red-700 mb-4">
          {t('description')}
        </p>
        
        {user.is_fundraiser && (
          <p className="text-red-600 text-sm mb-2">
            {t('fundraiserWarning')}
          </p>
        )}
        
        {user.is_donor && (
          <p className="text-red-600 text-sm mb-4">
            {t('donorWarning')}
          </p>
        )}

        <button
          onClick={() => setShowConfirmation(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          {t('deleteButton')}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-6">
      <h3 className="text-lg font-semibold text-red-900 mb-4">{t('confirmTitle')}</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-300 rounded-md p-3 mb-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <p className="text-red-700 mb-6">
        {t('confirmDescription', { name: user.name })}
      </p>
      
      <ul className="text-red-600 text-sm mb-6 space-y-1">
        <li>• {t('confirmList.deleteInfo')}</li>
        {user.is_fundraiser && <li>• {t('confirmList.removeServices')}</li>}
        {user.is_donor && <li>• {t('confirmList.deleteHistory')}</li>}
        <li>• {t('confirmList.signOut')}</li>
        <li>• {t('confirmList.cannotUndo')}</li>
      </ul>

      <div className="flex space-x-4">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? t('deleting') : t('confirmButton')}
        </button>
        
        <button
          onClick={() => setShowConfirmation(false)}
          disabled={loading}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 transition-colors"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  )
}