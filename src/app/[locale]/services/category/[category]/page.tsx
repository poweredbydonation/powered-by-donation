import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Service } from '@/types/database'
import MultilingualNavbar from '@/components/MultilingualNavbar'
import ServiceList from '@/components/services/ServiceList'
import ServiceSort, { SortOption, sortServices } from '@/components/services/ServiceSort'
import Link from 'next/link'
import { getMessages } from 'next-intl/server'

interface CategoryPageProps {
  params: {
    category: string
    locale: string
  }
}

type ServiceWithProvider = Service & {
  user: {
    name: string
    bio?: string
    location?: string
  }
}

// Common service categories - should match ServiceFilter categories
const SERVICE_CATEGORIES = [
  'Web Design',
  'Tutoring', 
  'Consulting',
  'Writing',
  'Photography',
  'Marketing',
  'Development', 
  'Design',
  'Business',
  'Health & Wellness',
  'Education',
  'Technology',
  'Creative',
  'Other'
]

// Format category for display (decode URL and capitalize)
function formatCategoryName(category: string): string {
  return decodeURIComponent(category)
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Format category for URL (encode and lowercase with hyphens)
function formatCategorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function getServicesByCategory(category: string): Promise<ServiceWithProvider[]> {
  const supabase = createClient()
  const formattedCategory = formatCategoryName(category)

  const { data: services, error } = await supabase
    .from('services')
    .select(`
      *,
      user:users (
        name,
        bio,
        location
      )
    `)
    .eq('is_active', true)
    .eq('show_in_directory', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  // Filter services by category (search in title and description)
  return (services || []).filter(service => 
    service.title.toLowerCase().includes(formattedCategory.toLowerCase()) ||
    service.description?.toLowerCase().includes(formattedCategory.toLowerCase())
  )
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categoryName = formatCategoryName(params.category)
  const services = await getServicesByCategory(params.category)

  if (!SERVICE_CATEGORIES.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
    return {
      title: 'Category Not Found | Powered by Donation'
    }
  }

  const totalDonationPotential = services.reduce((sum, service) => sum + service.donation_amount, 0)
  const formattedAmount = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
  }).format(totalDonationPotential)

  return {
    title: `${categoryName} Services | Powered by Donation`,
    description: `Discover ${services.length} ${categoryName.toLowerCase()} services where providers offer their skills in exchange for charitable donations. Total donation potential: ${formattedAmount}`,
    openGraph: {
      title: `${categoryName} Services - ${services.length} Available`,
      description: `Support ${categoryName.toLowerCase()} providers while helping charities. ${services.length} services available with ${formattedAmount} donation potential.`,
      type: 'website',
    },
    keywords: `${categoryName.toLowerCase()}, charity, donations, services, JustGiving, ${categoryName.toLowerCase()} help, volunteer services`
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, category } = params
  const messages = await getMessages({ locale })
  const categoryName = formatCategoryName(category)
  
  // Validate category exists
  if (!SERVICE_CATEGORIES.some(cat => cat.toLowerCase() === categoryName.toLowerCase())) {
    notFound()
  }

  const services = await getServicesByCategory(category)

  // Calculate category statistics
  const totalDonationPotential = services.reduce((sum, service) => sum + service.donation_amount, 0)
  const activeProviders = new Set(services.map(s => s.user_id)).size
  const averageDonation = services.length > 0 ? Math.round(totalDonationPotential / services.length) : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Sort services by newest first initially
  const sortedServices = sortServices(services, 'newest')

  return (
    <>
      <MultilingualNavbar locale={locale} messages={messages} />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Category Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                <div className="flex-1">
                  <nav className="text-sm text-gray-500 mb-3">
                    <Link href="/browse" className="hover:text-gray-700">Browse Services</Link>
                    <span className="mx-2">›</span>
                    <span className="text-gray-900 font-medium">{categoryName}</span>
                  </nav>
                  
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    {categoryName} Services
                  </h1>
                  
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Discover {categoryName.toLowerCase()} services where skilled providers offer their expertise 
                    in exchange for charitable donations. Support causes you care about while getting professional help.
                  </p>
                </div>

                {/* Category Stats */}
                <div className="lg:w-80">
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg border border-blue-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                      Category Overview
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{services.length}</div>
                        <div className="text-sm text-gray-600">Available Services</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalDonationPotential)}
                        </div>
                        <div className="text-sm text-gray-600">Total Donation Potential</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">{activeProviders}</div>
                        <div className="text-sm text-gray-600">Active Providers</div>
                      </div>
                      {averageDonation > 0 && (
                        <div>
                          <div className="text-2xl font-bold text-orange-600">
                            {formatCurrency(averageDonation)}
                          </div>
                          <div className="text-sm text-gray-600">Average Donation</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services Results */}
          {services.length > 0 ? (
            <>
              {/* Sort Controls */}
              <ServiceSort
                currentSort="newest"
                onSortChange={() => {}} // Client-side sorting would need state management
                resultsCount={services.length}
              />

              {/* Services List */}
              <ServiceList
                services={sortedServices}
                loading={false}
                error={null}
                emptyMessage={`No ${categoryName.toLowerCase()} services are currently available. Check back soon for new opportunities!`}
              />
            </>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-12 text-center">
                <div className="text-gray-400 mb-6">
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
                <h3 className="text-xl font-medium text-gray-900 mb-3">
                  No {categoryName} Services Yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  We don't have any {categoryName.toLowerCase()} services available right now, 
                  but new providers join regularly. Check back soon or browse other categories!
                </p>
                <Link
                  href="/browse"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                >
                  Browse All Services
                </Link>
              </div>
            </div>
          )}

          {/* Related Categories */}
          <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Explore Other Categories</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {SERVICE_CATEGORIES
                  .filter(cat => cat.toLowerCase() !== categoryName.toLowerCase())
                  .slice(0, 8)
                  .map((category) => (
                    <Link
                      key={category}
                      href={`/services/category/${formatCategorySlug(category)}`}
                      className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="text-sm font-medium text-gray-900">{category}</div>
                    </Link>
                  ))}
              </div>
              <div className="mt-6 text-center">
                <Link
                  href="/browse"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all categories →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}