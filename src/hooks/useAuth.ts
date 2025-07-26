'use client'

import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Alternative hook for checking if user is authenticated
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading, isAuthenticated: !!user }
}