import { getMessages } from 'next-intl/server'
import SearchPageClient from './SearchPageClient'

interface SearchPageProps {
  params: {
    locale: string
  }
}

export default async function SearchPageWrapper({ params }: SearchPageProps) {
  const { locale } = params
  const messages = await getMessages({ locale })

  return <SearchPageClient locale={locale} messages={messages} />
}