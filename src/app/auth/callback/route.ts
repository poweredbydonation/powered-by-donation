import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function handleAuthCallback(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  let code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // For POST requests (Apple), extract code from form data
  if (request.method === 'POST') {
    const formData = await request.formData()
    code = formData.get('code') as string
  }

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}

export async function GET(request: NextRequest) {
  return handleAuthCallback(request)
}

export async function POST(request: NextRequest) {
  return handleAuthCallback(request)
}