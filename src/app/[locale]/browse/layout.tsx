import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Services | Powered by Donation',
  description: 'Discover services where fundraisers offer their skills in exchange for charitable donations. Filter by category, location, donation amount, and fundraiser ratings.',
  openGraph: {
    title: 'Browse Services - Powered by Donation',
    description: 'Find services where skilled fundraisers offer their expertise for charitable donations. Support causes you care about while getting professional help.',
    type: 'website',
  },
  keywords: 'charity services, donation services, browse services, volunteer services, JustGiving, charitable giving'
}

export default function BrowseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}