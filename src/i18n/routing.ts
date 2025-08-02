import {createNavigation} from 'next-intl/navigation';
import {defineRouting} from 'next-intl/routing';
import { LOCALE_CODES, DEFAULT_LOCALE } from '@/config/languages';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: LOCALE_CODES,
 
  // Used when no locale matches
  defaultLocale: DEFAULT_LOCALE
});
 
// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const {Link, redirect, usePathname, useRouter} =
  createNavigation(routing);