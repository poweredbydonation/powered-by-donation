import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { AuthProvider } from '@/context/AuthContext'
import AuthDebug from '@/components/auth/AuthDebug'
import Footer from '@/components/Footer'

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

  return (
    <AuthProvider>
      <NextIntlClientProvider messages={messages}>
        <div className="min-h-screen flex flex-col">
          <div className="flex-grow">
            {children}
          </div>
          <Footer key={locale} />
        </div>
        <AuthDebug />
      </NextIntlClientProvider>
    </AuthProvider>
  );
}