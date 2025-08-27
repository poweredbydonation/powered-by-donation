'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useLocale } from 'next-intl'
// Using built-in JavaScript date formatting instead of date-fns
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return `${Math.floor(diffInSeconds / 604800)}w ago`
}

interface RecentDonation {
  id: string
  reference_id: string
  donation_amount: number
  organization_name: string
  service_title: string
  created_at: string
}

export default function FundraiserNotificationsBanner() {
  const { user } = useAuth()
  const locale = useLocale()
  const [recentDonations, setRecentDonations] = useState<RecentDonation[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    async function fetchRecentDonations() {
      const supabase = createClient()
      
      try {
        // Get donations from last 7 days for this fundraiser
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

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
          .eq('fundraiser_id', user!.id)
          .eq('status', 'success')
          .gte('created_at', sevenDaysAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(3) // Show max 3 recent donations

        if (error) {
          console.error('Error fetching recent donations:', error)
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

        setRecentDonations(formattedDonations)
      } catch (error) {
        console.error('Error in fetchRecentDonations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentDonations()
  }, [user])

  // Don't show banner if loading, no user, no recent donations, or dismissed
  if (loading || !user || recentDonations.length === 0 || dismissed) {
    return null
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  const totalAmount = recentDonations.reduce((sum, donation) => sum + donation.donation_amount, 0)

  return (
    <div className="bg-green-50 border-l-4 border-green-400 p-3 sm:p-4 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start flex-1 min-w-0">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm text-green-800 break-words">
                <span className="font-medium">
                  🎉 {recentDonations.length} new donation{recentDonations.length > 1 ? 's' : ''} received!
                </span>
                <span className="hidden sm:inline"> (£{totalAmount} total)</span>
                <span className="hidden sm:inline"> - </span>
                <br className="sm:hidden" />
                
                {/* Show the most recent donation */}
                <span className="text-xs text-green-600 block sm:inline mt-1 sm:mt-0">
                  Latest: £{recentDonations[0].donation_amount} → {recentDonations[0].organization_name} • {' '}
                  {getTimeAgo(new Date(recentDonations[0].created_at))}
                </span>
                
                <br className="sm:hidden" />
                <Link 
                  href={`/${locale}/my/service-requests`} 
                  className="text-green-800 underline hover:text-green-900 font-medium text-sm"
                >
                  <span className="hidden sm:inline">View your services</span>
                  <span className="sm:hidden">View services</span>
                </Link>
              </p>
            </div>
          </div>
          
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-green-400 hover:text-green-500 transition-colors"
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