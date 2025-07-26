import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Powered by Donation - Service Marketplace for Charity',
    template: '%s | Powered by Donation'
  },
  description: 'Connect with service providers who donate their earnings to charity. Find services, support causes, and make a difference in your community.',
  keywords: ['charity', 'donation', 'service marketplace', 'Australia', 'community'],
  authors: [{ name: 'Powered by Donation' }],
  creator: 'Powered by Donation',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://poweredbydonation.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    url: '/',
    title: 'Powered by Donation - Service Marketplace for Charity',
    description: 'Connect with service providers who donate their earnings to charity. Find services, support causes, and make a difference in your community.',
    siteName: 'Powered by Donation',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Powered by Donation - Service Marketplace for Charity',
    description: 'Connect with service providers who donate their earnings to charity.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}