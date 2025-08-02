'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGoogle: () => Promise<{ error: any }>
  signInWithMicrosoft: () => Promise<{ error: any }>
  signInWithGitHub: () => Promise<{ error: any }>
  signInWithApple: () => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          setSession(null)
          setUser(null)
        } else {
          setSession(session)
          setUser(session?.user ?? null)
        }
      } catch (error) {
        console.error('Error in getSession:', error)
        setSession(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signInWithGoogle = async () => {
    // Extract locale from current URL
    const locale = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en'
    
    // Determine the correct redirect URL based on environment
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
    const redirectTo = isDevelopment 
      ? `http://localhost:3000/auth/callback`
      : `${window.location.origin}/auth/callback`
    
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          next: `/${locale}/dashboard`
        }
      }
    })
    return { error }
  }

  const signInWithMicrosoft = async () => {
    // Extract locale from current URL
    const locale = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en'
    
    // Determine the correct redirect URL based on environment
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
    const redirectTo = isDevelopment 
      ? `http://localhost:3000/auth/callback`
      : `${window.location.origin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo,
        scopes: 'openid profile email',
        queryParams: {
          next: `/${locale}/dashboard`
        }
      }
    })
    return { error }
  }

  const signInWithGitHub = async () => {
    // Extract locale from current URL
    const locale = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en'
    
    // Determine the correct redirect URL based on environment
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
    const redirectTo = isDevelopment 
      ? `http://localhost:3000/auth/callback`
      : `${window.location.origin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo,
        queryParams: {
          next: `/${locale}/dashboard`
        }
      }
    })
    return { error }
  }

  const signInWithApple = async () => {
    // Extract locale from current URL
    const locale = window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en'
    
    // Determine the correct redirect URL based on environment
    const isDevelopment = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
    const redirectTo = isDevelopment 
      ? `http://localhost:3000/auth/callback`
      : `${window.location.origin}/auth/callback`
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
        queryParams: {
          next: `/${locale}/dashboard`
        }
      }
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithGitHub,
    signInWithApple,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

