'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { ServiceRequest } from '@/types/database'
import { useLocale } from 'next-intl'

interface PendingDonation {
  id: string
  reference_id: string
  donation_amount: number
  organization_name: string
  service_title: string
  created_at: string
}

export default function PendingDonationsBanner() {
  const { user } = useAuth()
  const locale = useLocale()
  const [pendingDonations, setPendingDonations] = useState<PendingDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchPendingDonations() {
      const supabase = createClient()
      
      try {
        const { data, error } = await supabase
          .from('service_requests')
          .select(`
            id,
            reference_id,
            donation_amount,
            organization_name,
            created_at,
            services:service_id (title)
          `)
          .eq('donor_id', user!.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching pending donations:', error)
          return
        }

        const formattedDonations = data?.map(donation => ({
          id: donation.id,
          reference_id: donation.reference_id || 'Unknown',
          donation_amount: donation.donation_amount,
          organization_name: donation.organization_name || 'Unknown Organization',
          service_title: (donation.services as any)?.title || 'Unknown Service',
          created_at: donation.created_at || new Date().toISOString()
        })) || []

        setPendingDonations(formattedDonations)
      } catch (error) {
        console.error('Error in fetchPendingDonations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingDonations()
  }, [user])

  // Don't show banner if loading, no user, no pending donations, or dismissed
  if (loading || !user || pendingDonations.length === 0 || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 sm:p-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-2">
        <div className="flex items-start flex-1 min-w-0">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm text-yellow-800 break-words">
              <span className="font-medium">
                {pendingDonations.length} pending donation{pendingDonations.length > 1 ? 's' : ''}
              </span>
              <span className="hidden sm:inline"> - </span>
              <br className="sm:hidden" />
              <Link 
                href={`/${locale}/dashboard/donations`} 
                className="text-yellow-800 underline hover:text-yellow-900 font-medium"
              >
                <span className="hidden sm:inline">Check status and track progress</span>
                <span className="sm:hidden">Check status</span>
              </Link>
            </p>
          </div>
        </div>
        
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-yellow-400 hover:text-yellow-500 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        </div>
      </div>
    </div>
  )
}