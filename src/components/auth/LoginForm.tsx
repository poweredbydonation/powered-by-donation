'use client'

import { useState } from 'react'
import { useRouter, Link } from '@/i18n/routing'
import { useAuth } from '@/hooks/useAuth'
import GoogleSignInButton from './GoogleSignInButton'
import MicrosoftSignInButton from './MicrosoftSignInButton'
import GitHubSignInButton from './GitHubSignInButton'
import AppleSignInButton from './AppleSignInButton'

interface LoginFormProps {
  locale: string
  messages: any
}

export default function LoginForm({ locale, messages }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()
  
  // Get translations from the passed messages
  const t = (key: string) => {
    const keys = key.split('.')
    let value = messages?.auth?.login
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      router.push('/dashboard')
    }
    
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{t('title')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('email_placeholder')}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('password_placeholder')}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? t('signing_in') : t('sign_in_button')}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('or_continue_with')}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <GoogleSignInButton />
          <MicrosoftSignInButton />
          <GitHubSignInButton />
          <AppleSignInButton />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        {t('no_account')}{' '}
        <Link href="/signup" className="text-blue-600 hover:text-blue-500">
          {t('sign_up_link')}
        </Link>
      </p>
    </div>
  )
}