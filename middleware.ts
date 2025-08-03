import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('🔥 MIDDLEWARE RUNNING:', request.nextUrl.pathname)
  
  // Super simple test - just redirect root to /en
  if (request.nextUrl.pathname === '/') {
    console.log('🔥 REDIRECTING ROOT TO /en')
    return NextResponse.redirect(new URL('/en', request.url))
  }
  
  console.log('🔥 MIDDLEWARE CONTINUING')
  return NextResponse.next()
}

export const config = {
  // Match absolutely everything to test
  matcher: ['/(.*)','/']
}