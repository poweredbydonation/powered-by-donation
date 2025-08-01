import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function handleAuthCallback(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  let code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  
  // Detect locale from referrer or default to 'en'
  const referrer = request.headers.get('referer')
  const localeMatch = referrer?.match(/\/([a-z]{2})\//)
  const locale = localeMatch?.[1] ?? 'en'
  
  const next = searchParams.get('next') ?? `/${locale}/dashboard`

  console.log('Auth callback received:', {
    method: request.method,
    code: code ? `${code.substring(0, 10)}...` : 'null',
    error,
    errorDescription,
    locale,
    next,
    origin,
    referrer
  })

  // Handle OAuth errors from provider
  if (error) {
    console.error('OAuth provider error:', error, errorDescription)
    const errorParams = new URLSearchParams({
      error,
      ...(errorDescription && { error_description: errorDescription })
    })
    return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error?${errorParams}`)
  }

  // For POST requests (Apple), extract code from form data
  if (request.method === 'POST') {
    const formData = await request.formData()
    code = formData.get('code') as string
    console.log('Extracted code from POST:', code ? `${code.substring(0, 10)}...` : 'null')
  }

  if (code) {
    const supabase = createClient()
    console.log('Attempting to exchange code for session...')
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      console.log('Successfully exchanged code for session')
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      const redirectUrl = isLocalEnv ? `${origin}${next}` : forwardedHost ? `https://${forwardedHost}${next}` : `${origin}${next}`
      
      console.log('Redirecting to:', redirectUrl)
      return NextResponse.redirect(redirectUrl)
    } else {
      console.error('Error exchanging code for session:', exchangeError)
      const errorParams = new URLSearchParams({
        error: 'exchange_failed',
        error_description: exchangeError.message,
        code: code.substring(0, 20)
      })
      return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error?${errorParams}`)
    }
  }

  // No code received
  console.error('No authorization code received')
  const errorParams = new URLSearchParams({
    error: 'no_code',
    error_description: 'No authorization code was received from the OAuth provider'
  })
  return NextResponse.redirect(`${origin}/${locale}/auth/auth-code-error?${errorParams}`)
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request)
}

export async function POST(request: NextRequest) {
  return handleAuthCallback(request)
}