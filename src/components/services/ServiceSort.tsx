'use client'

export type SortOption = 'newest' | 'oldest' | 'price_low' | 'price_high' | 'happiness_high' | 'happiness_low' | 'title_asc' | 'title_desc'

interface ServiceSortProps {
  currentSort: SortOption
  onSortChange: (sort: SortOption) => void
  resultsCount?: number
}

const SORT_OPTIONS: { value: SortOption; label: string; description: string }[] = [
  { value: 'newest', label: 'Newest First', description: 'Recently added services' },
  { value: 'oldest', label: 'Oldest First', description: 'Longest available services' },
  { value: 'price_low', label: 'Donation: Low to High', description: 'Smallest donation amount first' },
  { value: 'price_high', label: 'Donation: High to Low', description: 'Largest donation amount first' },
  { value: 'happiness_high', label: 'Highest Rated', description: 'Best provider ratings first' },
  { value: 'happiness_low', label: 'Lowest Rated', description: 'Needs improvement first' },
  { value: 'title_asc', label: 'Title: A to Z', description: 'Alphabetical order' },
  { value: 'title_desc', label: 'Title: Z to A', description: 'Reverse alphabetical order' }
]

export default function ServiceSort({ currentSort, onSortChange, resultsCount }: ServiceSortProps) {
  const currentSortOption = SORT_OPTIONS.find(option => option.value === currentSort)

  return (
    <div className="flex items-center justify-between mb-6">
      {/* Results Count */}
      <div className="text-sm text-gray-600">
        {resultsCount !== undefined && (
          <>
            {resultsCount === 0 ? (
              'No services found'
            ) : resultsCount === 1 ? (
              '1 service found'
            ) : (
              `${resultsCount.toLocaleString()} services found`
            )}
          </>
        )}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center space-x-4">
        <label htmlFor="sort" className="text-sm font-medium text-gray-700">
          Sort by:
        </label>
        
        <div className="relative">
          <select
            id="sort"
            value={currentSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom dropdown arrow */}
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>

        {/* Sort Description (hidden on mobile) */}
        {currentSortOption && (
          <div className="hidden md:block text-xs text-gray-500 italic">
            {currentSortOption.description}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to generate SQL ORDER BY clause based on sort option
export function getSortClause(sortOption: SortOption): string {
  switch (sortOption) {
    case 'newest':
      return 'created_at DESC'
    case 'oldest':
      return 'created_at ASC'
    case 'price_low':
      return 'donation_amount ASC'
    case 'price_high':
      return 'donation_amount DESC'
    case 'happiness_high':
      return 'happiness_rate DESC NULLS LAST'
    case 'happiness_low':
      return 'happiness_rate ASC NULLS LAST'
    case 'title_asc':
      return 'title ASC'
    case 'title_desc':
      return 'title DESC'
    default:
      return 'created_at DESC'
  }
}

// Helper function to sort services in memory (for client-side sorting)
export function sortServices<T extends { created_at?: Date | string, donation_amount: number, happiness_rate?: number | null, title: string }>(
  services: T[], 
  sortOption: SortOption
): T[] {
  const sortedServices = [...services]
  
  return sortedServices.sort((a, b) => {
    switch (sortOption) {
      case 'newest': {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateB - dateA
      }
      case 'oldest': {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateA - dateB
      }
      case 'price_low':
        return a.donation_amount - b.donation_amount
      case 'price_high':
        return b.donation_amount - a.donation_amount
      case 'happiness_high': {
        const happinessA = a.happiness_rate ?? -1
        const happinessB = b.happiness_rate ?? -1
        return happinessB - happinessA
      }
      case 'happiness_low': {
        const happinessA = a.happiness_rate ?? 101
        const happinessB = b.happiness_rate ?? 101
        return happinessA - happinessB
      }
      case 'title_asc':
        return a.title.localeCompare(b.title)
      case 'title_desc':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })
}