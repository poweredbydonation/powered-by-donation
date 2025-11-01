'use client'

import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { User } from '@/types/database'
import { computeUserRoles } from '@/lib/utils/user-roles'

interface EnhancedAuthState {
  user: User | null
  supabaseUser: SupabaseUser | null
  loading: boolean
  error: string | null
}

/**
 * Enhanced Auth Hook that provides user profile data with computed roles
 * This hook combines Supabase auth with our custom user profile system
 */
export function useEnhancedAuth(): EnhancedAuthState {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const fetchUserProfile = async (authUser: SupabaseUser | null) => {
      if (!authUser) {
        setUser(null)
        setSupabaseUser(null)
        setLoading(false)
        return
      }

      try {
        setSupabaseUser(authUser)
        
        // Fetch user profile with new timestamp columns
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select(`
            *,
            fundraiser_service_terms_accepted_time,
            donor_service_terms_accepted_time,
            donor_organization_terms_accepted_time
          `)
          .eq('id', authUser.id)
          .single()

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            // User profile doesn't exist, this is normal for new users
            console.log('User profile not found, user may need to complete setup')
            setUser(null)
          } else {
            throw profileError
          }
        } else if (profile) {
          // Compute roles from timestamps and set user
          const userWithRoles = computeUserRoles(profile as User)
          setUser(userWithRoles)
        }
        
        setError(null)
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch user profile')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        await fetchUserProfile(session?.user ?? null)
      } catch (err) {
        console.error('Error getting session:', err)
        setError(err instanceof Error ? err.message : 'Session error')
        setUser(null)
        setSupabaseUser(null)
        setLoading(false)
      }
    }

    // Initial session load
    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        await fetchUserProfile(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  return {
    user,
    supabaseUser,
    loading,
    error
  }
}

/**
 * Check if user has accepted specific terms
 */
export function useTermsStatus(
  termsType: 'fundraiser_service' | 'donor_service' | 'donor_organization'
) {
  const { user } = useEnhancedAuth()
  
  if (!user) return false
  
  switch (termsType) {
    case 'fundraiser_service':
      return !!user.fundraiser_service_terms_accepted_time
    case 'donor_service':
      return !!user.donor_service_terms_accepted_time
    case 'donor_organization':
      return !!user.donor_organization_terms_accepted_time
    default:
      return false
  }
}

/**
 * Get user roles computed from terms timestamps
 */
export function useUserRoles() {
  const { user } = useEnhancedAuth()
  
  return {
    isFundraiser: user?.is_fundraiser ?? false,
    isDonor: user?.is_donor ?? false,
    hasAnyRole: (user?.is_fundraiser || user?.is_donor) ?? false,
    fundraiserTermsAccepted: !!user?.fundraiser_service_terms_accepted_time,
    donorServiceTermsAccepted: !!user?.donor_service_terms_accepted_time,
    donorOrgTermsAccepted: !!user?.donor_organization_terms_accepted_time
  }
}