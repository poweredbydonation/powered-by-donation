'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import GoogleSignInButton from './GoogleSignInButton'
import MicrosoftSignInButton from './MicrosoftSignInButton'
import GitHubSignInButton from './GitHubSignInButton'
import AppleSignInButton from './AppleSignInButton'

interface SignupFormProps {
  locale: string
  messages: any
}

export default function SignupForm({ locale, messages }: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  // Custom translation function
  const t = (key: string) => {
    const keys = key.split('.')
    let value = messages?.auth?.signup
    for (const k of keys) {
      value = value?.[k]
    }
    return value || key
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError(t('errors.passwordMismatch'))
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t('errors.passwordTooShort'))
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-green-600">{t('success.title')}</h2>
          <p className="text-gray-600">
            {t('success.message')} <strong>{email}</strong>. 
            {t('success.instruction')}
          </p>
          <a 
            href={`/${locale}/login`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-500"
          >
            {t('success.backToLogin')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">{t('title')}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('fields.email')}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('placeholders.email')}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('fields.password')}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('placeholders.password')}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('fields.confirmPassword')}
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder={t('placeholders.confirmPassword')}
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
          {loading ? t('buttons.creating') : t('buttons.create')}
        </button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('divider')}</span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <GoogleSignInButton text={t('socialButtons.google')} />
          <MicrosoftSignInButton text={t('socialButtons.microsoft')} />
          <GitHubSignInButton text={t('socialButtons.github')} />
          <AppleSignInButton text={t('socialButtons.apple')} />
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-gray-600">
        {t('footer.hasAccount')}{' '}
        <a href={`/${locale}/login`} className="text-blue-600 hover:text-blue-500">
          {t('footer.signIn')}
        </a>
      </p>
    </div>
  )
}