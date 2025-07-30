import ServiceCard from './ServiceCard'
import { Service } from '@/types/database'

interface ServiceListProps {
  services: (Service & {
    user: {
      name: string
      bio?: string
      location?: string
    } | null
  })[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
}

function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-pulse">
      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>

        {/* Info grid skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="h-3 bg-gray-200 rounded mb-2 w-24"></div>
            <div className="h-5 bg-gray-200 rounded w-16"></div>
          </div>
          <div>
            <div className="h-3 bg-gray-200 rounded mb-2 w-16"></div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        {/* Bottom section skeleton */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Status skeleton */}
        <div className="mt-3">
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full">
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {message}
        </p>
      </div>
    </div>
  )
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="col-span-full">
      <div className="text-center py-12">
        <div className="text-red-400 mb-4">
          <svg
            className="mx-auto h-16 w-16"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          {error}
        </p>
      </div>
    </div>
  )
}

export default function ServiceList({ 
  services, 
  loading = false, 
  error = null,
  emptyMessage = "No services are currently available. Check back soon for new opportunities to support charities!"
}: ServiceListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Loading State */}
      {loading && (
        <>
          {Array.from({ length: 6 }).map((_, index) => (
            <ServiceCardSkeleton key={`skeleton-${index}`} />
          ))}
        </>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState error={error} />
      )}

      {/* Empty State */}
      {!loading && !error && services.length === 0 && (
        <EmptyState message={emptyMessage} />
      )}

      {/* Services */}
      {!loading && !error && services.length > 0 && (
        <>
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </>
      )}
    </div>
  )
}