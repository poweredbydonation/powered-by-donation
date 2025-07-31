import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  // A list of all locales that are supported - prioritized by Australian demographics  
  locales: ['en', 'zh', 'ar', 'vi', 'yue', 'pa', 'el', 'it', 'tl', 'hi', 'es'],
  
  // Used when no locale matches
  defaultLocale: 'en'
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Skip all internal paths (_next), API routes, auth routes, and static files
    '/((?!_next|api|auth|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'
  ]
};