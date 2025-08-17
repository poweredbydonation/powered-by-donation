import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/context/AuthContext'
import Footer from '@/components/Footer'
import DonorNotificationsBanner from '@/components/DonorNotificationsBanner'
import FundraiserNotificationsBanner from '@/components/FundraiserNotificationsBanner'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import { createClient } from '@/lib/supabase/server'

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  // Load platform statistics for navbar
  const supabase = createClient()
  const [justgivingStats, everyorgStats, acncStats, servicesStats] = await Promise.all([
    // Get JustGiving count
    supabase
      .from('organization_cache')
      .select('id', { count: 'exact', head: true })
      .eq('platform', 'justgiving')
      .eq('is_active', true),
    
    // Get Every.org count
    supabase
      .from('organization_cache')
      .select('id', { count: 'exact', head: true })
      .eq('platform', 'everyorg')
      .eq('is_active', true),
    
    // Get ACNC count
    supabase
      .from('organization_cache')
      .select('id', { count: 'exact', head: true })
      .eq('platform', 'acnc')
      .eq('is_active', true),
    
    // Get Services count
    supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const platformStats = {
    services: servicesStats.count || 0,
    justgiving: justgivingStats.count || 0,
    everyorg: everyorgStats.count || 0,
    acnc: acncStats.count || 0,
  };

  return (
    <AuthProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div className="min-h-screen flex flex-col">
          <MultilingualNavbar locale={locale} messages={messages} platformStats={platformStats} />
          <DonorNotificationsBanner />
          <FundraiserNotificationsBanner />
          <div className="flex-grow pt-20 md:pt-36">
            {children}
          </div>
          <Footer key={locale} />
        </div>
      </NextIntlClientProvider>
    </AuthProvider>
  );
}