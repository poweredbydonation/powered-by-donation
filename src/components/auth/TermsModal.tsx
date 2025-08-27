'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type TermsType = 'fundraiser_service' | 'donor_service' | 'donor_organization'

interface TermsModalProps {
  isOpen: boolean
  onClose: () => void
  onAccept: () => void
  termsType: TermsType
  userId: string
}

const TERMS_CONTENT = {
  fundraiser_service: {
    title: 'Fundraiser Service Terms',
    content: [
      'You agree to provide the services you offer in exchange for charitable donations.',
      'You will deliver services professionally and on time as described.',
      'You understand that donors are making charitable donations, not purchasing services.',
      'You will respond to service requests and feedback in a timely manner.',
      'You are responsible for the quality and delivery of your services.'
    ]
  },
  donor_service: {
    title: 'Service Request Terms',
    content: [
      'You agree to make charitable donations in exchange for services offered by fundraisers.',
      'Your donations go directly to the charities you select, not to the fundraiser.',
      'You understand this is charitable giving, not a commercial transaction.',
      'You will provide feedback on services received to help improve the platform.',
      'You agree to communicate respectfully with fundraisers.'
    ]
  },
  donor_organization: {
    title: 'Direct Donation Terms',
    content: [
      'You agree to make direct charitable donations to organizations on the platform.',
      'Your donations go directly to the selected charity or organization.',
      'You understand these are charitable donations, not purchases.',
      'You are responsible for keeping donation records for tax purposes.',
      'You agree that all donations are final and non-refundable.'
    ]
  }
}

export default function TermsModal({ isOpen, onClose, onAccept, termsType, userId }: TermsModalProps) {
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const terms = TERMS_CONTENT[termsType]

  const handleAccept = async () => {
    if (!userId) {
      setError('User not found. Please log in again.')
      return
    }

    setAccepting(true)
    setError(null)

    try {
      const timestampColumn = `${termsType}_terms_accepted_time`
      const now = new Date().toISOString()

      const { error: updateError } = await supabase
        .from('users')
        .update({ [timestampColumn]: now })
        .eq('id', userId)

      if (updateError) {
        throw updateError
      }

      onAccept()
    } catch (err) {
      console.error('Error accepting terms:', err)
      setError(err instanceof Error ? err.message : 'Failed to accept terms')
    } finally {
      setAccepting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {terms.title}
            </h2>
            
            <div className="space-y-3 mb-6">
              <p className="text-sm text-gray-600">
                By continuing, you agree to the following terms:
              </p>
              
              <ul className="space-y-2">
                {terms.content.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 mr-2 mt-1">•</span>
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600">
                  <strong>Powered by Donation</strong><br />
                  ABN: 17 927 784 658<br />
                  Contact: contact@poweredbydonation.com
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                disabled={accepting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={accepting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {accepting ? 'Accepting...' : 'Accept & Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}