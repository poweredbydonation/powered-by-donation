import { createBrowserClient } from '@supabase/ssr'
import { validateEnvVars } from '@/lib/env-validation'

export function createClient() {
  // Validate environment variables in development
  if (process.env.NODE_ENV === 'development') {
    validateEnvVars()
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}