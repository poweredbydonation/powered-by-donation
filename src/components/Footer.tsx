'use client';

import { Heart, Github, ExternalLink } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Footer = () => {
  const t = useTranslations('footer');
  const hookLocale = useLocale();
  const pathname = usePathname();
  
  // Extract locale from pathname as fallback
  const urlLocale = pathname.split('/')[1] || 'en';
  const locale = urlLocale;
  

  return (
    <footer className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trust & Transparency Section */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <div className="grid md:grid-cols-2 gap-6">
            {/* No Platform Fees */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Heart className="h-6 w-6 text-green-600 mt-1" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('trust.noFees.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {(() => {
                    const description = t('trust.noFees.description');
                    const parts = description.split('JustGiving');
                    if (parts.length > 1) {
                      return (
                        <>
                          {parts[0]}
                          <a 
                            href="https://www.justgiving.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 mx-1 inline-flex items-center"
                          >
                            JustGiving
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          {parts[1]}
                        </>
                      );
                    }
                    return description;
                  })()}
                </p>
              </div>
            </div>

            {/* Open Source */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <Github className="h-6 w-6 text-gray-700 mt-1" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t('trust.openSource.title')}
                </h3>
                <p className="text-gray-600 text-sm">
                  {(() => {
                    const description = t('trust.openSource.description');
                    const parts = description.split('GitHub');
                    if (parts.length > 1) {
                      return (
                        <>
                          {parts[0]}
                          <a 
                            href="https://github.com/poweredbydonation" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 mx-1 inline-flex items-center"
                          >
                            {t('navigation.community.github')}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </a>
                          {parts[1]}
                        </>
                      );
                    }
                    return description;
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <span className="font-semibold text-xl text-gray-900">PD</span>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {t('brand.tagline')}
            </p>
            <div className="text-xs text-gray-500">
              {t('brand.abn')}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">
              {t('navigation.platform.title')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href={`/${locale}/browse`} className="hover:text-gray-900">
                  {t('navigation.platform.browse_services')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="hover:text-gray-900">
                  {t('navigation.platform.service_fundraisers')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/charities`} className="hover:text-gray-900">
                  {t('navigation.platform.featured_charities')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/how-it-works`} className="hover:text-gray-900">
                  {t('navigation.platform.how_it_works')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">
              {t('navigation.legal.title')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href={`/${locale}/privacy`} className="hover:text-gray-900">
                  {t('navigation.legal.privacy_policy')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="hover:text-gray-900">
                  {t('navigation.legal.terms_of_service')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-gray-900">
                  {t('navigation.legal.about_us')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-gray-900">
                  {t('navigation.legal.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">
              {t('navigation.community.title')}
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a 
                  href="https://github.com/poweredbydonation" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-gray-900 inline-flex items-center"
                >
                  {t('navigation.community.github')}
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </li>
              <li>
                <Link href={`/${locale}/contribute`} className="hover:text-gray-900">
                  {t('navigation.community.contribute')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/feedback`} className="hover:text-gray-900">
                  {t('navigation.community.feedback')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/support`} className="hover:text-gray-900">
                  {t('navigation.community.support')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 mt-8 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <div className="text-sm text-gray-600">
              {t('bottom.copyright')}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{t('bottom.made_in')}</span>
              <span>•</span>
              <a 
                href="https://www.justgiving.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-900"
              >
                {t('bottom.powered_by')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;