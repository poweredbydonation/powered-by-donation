'use client'

import { useAuth } from '@/hooks/useAuth'

export default function AuthDebug() {
  const { user, loading, session } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Session: {session ? 'exists' : 'null'}</div>
    </div>
  )
}