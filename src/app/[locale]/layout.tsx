import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/context/AuthContext'
import MinimalFooter from '@/components/MinimalFooter'
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

  // Load platform statistics from cached stats table
  const supabase = createClient()
  const { data: statsData } = await supabase
    .from('platform_stats')
    .select('services_count, justgiving_count, everyorg_count, acnc_count')
    .order('last_updated', { ascending: false })
    .limit(1)
    .single()

  const platformStats = {
    services: statsData?.services_count || 0,
    justgiving: statsData?.justgiving_count || 0,
    everyorg: statsData?.everyorg_count || 0,
    acnc: statsData?.acnc_count || 0,
  };

  return (
    <AuthProvider>
      <NextIntlClientProvider messages={messages} locale={locale}>
        <div className="min-h-screen">
          <MultilingualNavbar locale={locale} messages={messages} platformStats={platformStats} />
          <div className="notification-banners">
            <DonorNotificationsBanner />
            <FundraiserNotificationsBanner />
          </div>
          <div className="pt-14 pb-12">
            {children}
          </div>
          <MinimalFooter />
        </div>
      </NextIntlClientProvider>
    </AuthProvider>
  );
}