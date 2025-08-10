import { JustGivingCharityCache } from '@/types/database'
import { Heart, ExternalLink, TrendingUp, Calendar } from 'lucide-react'

interface CharityCardProps {
  charity: JustGivingCharityCache
  locale: string
}

export default function CharityCard({ charity, locale }: CharityCardProps) {
  // Generate charity page URL
  const charityUrl = `/${locale}/justgiving/charity/${charity.slug}`

  // Format donation statistics
  const totalDonations = charity.total_donations_count || 0
  const totalAmount = charity.total_amount_received || 0
  const thisMonthDonations = charity.this_month_count || 0
  const thisMonthAmount = charity.this_month_amount || 0

  // Has received donations
  const hasActivity = totalDonations > 0
  const hasRecentActivity = thisMonthDonations > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200">
      <div className="p-6">
        {/* Charity Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 pr-2">
              <a 
                href={charityUrl}
                className="text-xl font-semibold text-gray-900 hover:text-blue-600 line-clamp-2 block"
              >
                {charity.name}
              </a>
            </div>
            {charity.logo_url && (
              <img 
                src={charity.logo_url} 
                alt={`${charity.name} logo`}
                className="w-12 h-12 object-contain rounded flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
          </div>
          
          {/* Category Badge */}
          {charity.category && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {charity.category}
            </span>
          )}
        </div>

        {/* Charity Description */}
        {charity.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {charity.description}
          </p>
        )}

        {/* Activity Statistics */}
        <div className="space-y-3 mb-4">
          {hasActivity ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-gray-600">
                  <Heart className="h-3 w-3 mr-1 text-red-500" />
                  <span>Total Support</span>
                </div>
                <div className="font-medium text-gray-900">
                  {totalDonations} donation{totalDonations !== 1 ? 's' : ''} • £{totalAmount.toLocaleString()}
                </div>
              </div>
              
              {hasRecentActivity && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span>This Month</span>
                  </div>
                  <div className="font-medium text-green-600">
                    {thisMonthDonations} donation{thisMonthDonations !== 1 ? 's' : ''} • £{thisMonthAmount.toLocaleString()}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center text-sm text-gray-500">
              <Heart className="h-3 w-3 mr-1" />
              <span>No service donations yet</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <a 
            href={charityUrl}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center"
          >
            View Services
            <ExternalLink className="h-3 w-3 ml-1" />
          </a>
          
          <div className="text-xs text-gray-500">
            {hasActivity ? 'Community Supported' : 'Available to Support'}
          </div>
        </div>

        {/* Recent Activity Indicator */}
        {hasRecentActivity && (
          <div className="mt-3 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 text-center">
            Active this month
          </div>
        )}
      </div>
    </div>
  )
}