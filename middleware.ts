import createMiddleware from 'next-intl/middleware';
import {NextRequest} from 'next/server';
import {routing} from './src/i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static files explicitly
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/_vercel/') ||
    pathname.includes('.') || // Any file with extension
    pathname === '/favicon.ico' ||
    pathname === '/favicon.svg' ||
    pathname.startsWith('/public/')
  ) {
    return;
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except static assets
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, favicon.svg (favicon files)
     * - public folder (public assets)
     * - any file with an extension
     */
    '/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|public|.*\\..*).*)',
  ],
};