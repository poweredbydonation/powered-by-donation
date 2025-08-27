'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const MinimalFooter = () => {
  const pathname = usePathname();
  
  // Extract locale from pathname as fallback
  const urlLocale = pathname.split('/')[1] || 'en';
  const locale = urlLocale;

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-2">
        <div className="flex flex-col sm:flex-row justify-between items-center text-xs text-gray-600 space-y-1 sm:space-y-0">
          {/* Left side - Copyright and ABN */}
          <div className="flex items-center space-x-4">
            <span>© 2025 Powered by Donation</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">ABN: 17 927 784 658</span>
          </div>
          
          {/* Right side - Links */}
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/privacy`} className="hover:text-gray-900">
              Privacy
            </Link>
            <span>•</span>
            <Link href={`/${locale}/terms`} className="hover:text-gray-900">
              Terms
            </Link>
            <span>•</span>
            <Link href={`/${locale}/contact`} className="hover:text-gray-900">
              Contact
            </Link>
            <span>•</span>
            <a 
              href="https://www.justgiving.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-gray-900"
            >
              JustGiving
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default MinimalFooter;