import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar', 'tr'],
  
  // Used when no locale matches
  defaultLocale: 'en'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - API routes
    // - _next static files
    // - _next image optimization files
    // - favicon.ico
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};