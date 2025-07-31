import SearchPageWrapper from './SearchPageWrapper'

interface SearchPageProps {
  params: {
    locale: string
  }
}

export default function SearchPage({ params }: SearchPageProps) {
  return <SearchPageWrapper params={params} />
}