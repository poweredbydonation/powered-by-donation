'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AppleSignInButtonProps {
  text?: string
  className?: string
}

export default function AppleSignInButton({ 
  text = "Continue with Apple",
  className = ""
}: AppleSignInButtonProps) {
  const [loading, setLoading] = useState(false)
  const { signInWithApple } = useAuth()

  const handleAppleSignIn = async () => {
    setLoading(true)
    const { error } = await signInWithApple()
    
    if (error) {
      console.error('Apple sign-in error:', error)
      setLoading(false)
    }
    // Note: If successful, user will be redirected to Apple, so no need to setLoading(false)
  }

  return (
    <button
      onClick={handleAppleSignIn}
      disabled={loading}
      className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-black text-sm font-medium text-white hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
      ) : (
        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.52.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.09z"/>
        </svg>
      )}
      {loading ? 'Signing in...' : text}
    </button>
  )
}