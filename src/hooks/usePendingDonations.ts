'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export function usePendingDonations() {
  const { user } = useAuth()
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setPendingCount(0)
      setLoading(false)
      return
    }

    async function fetchPendingCount() {
      const supabase = createClient()
      
      try {
        const { count, error } = await supabase
          .from('service_requests')
          .select('*', { count: 'exact', head: true })
          .eq('donor_id', user!.id)
          .eq('status', 'pending')

        if (error) {
          console.error('Error fetching pending donations count:', error)
          setPendingCount(0)
        } else {
          setPendingCount(count || 0)
        }
      } catch (error) {
        console.error('Error in fetchPendingCount:', error)
        setPendingCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingCount()
  }, [user])

  return { pendingCount, loading }
}