'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface MicrosoftSignInButtonProps {
  text?: string
  className?: string
}

export default function MicrosoftSignInButton({ 
  text = "Continue with Microsoft",
  className = ""
}: MicrosoftSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const { signInWithMicrosoft } = useAuth()

  const handleMicrosoftSignIn = async () => {
    setLoading(true)
    const { error } = await signInWithMicrosoft()
    
    if (error) {
      console.error('Microsoft sign-in error:', error)
      setLoading(false)
    }
    // Note: If successful, user will be redirected to Microsoft, so no need to setLoading(false)
  }

  return (
    <button
      onClick={handleMicrosoftSignIn}
      disabled={loading}
      className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-700 mr-2"></div>
      ) : (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 23 23">
          <path fill="#f35325" d="M1 1h10v10H1z"/>
          <path fill="#81bc06" d="M12 1h10v10H12z"/>
          <path fill="#05a6f0" d="M1 12h10v10H1z"/>
          <path fill="#ffba08" d="M12 12h10v10H12z"/>
        </svg>
      )}
      {loading ? 'Signing in...' : text}
    </button>
  )
}