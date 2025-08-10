import { JustGivingCharityCache } from '@/types/database'
import { Heart, ExternalLink, TrendingUp, Calendar, MapPin, Globe, Shield, Star } from 'lucide-react'

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
  
  // Enhanced data availability
  const hasEnhancedData = charity.enhanced_data_fetched_at !== null
  const charityLocation = charity.address_city && charity.address_country 
    ? `${charity.address_city}, ${charity.address_country}` 
    : charity.address_country || charity.country_code
  const isApproved = charity.is_approved === true
  const isRegistered = charity.registration_number && 
    charity.registration_number.trim() !== '' && 
    !charity.registration_number.toLowerCase().includes('n/a')

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
            <div className="w-16 h-16 flex-shrink-0 ml-2">
              {charity.logo_url ? (
                <img 
                  src={charity.logo_url} 
                  alt={`${charity.name} logo`}
                  className="w-full h-full object-contain rounded-lg border border-gray-200 bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Show fallback icon instead
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                          <svg class="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
                          </svg>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200">
                  <Heart className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>
          
          {/* Category and Status Badges */}
          <div className="flex flex-wrap gap-2">
            {charity.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {charity.category}
              </span>
            )}
            
            {isApproved && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <Shield className="h-2 w-2 mr-1" />
                JustGiving Approved
              </span>
            )}
            
            {isRegistered && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                Registered
              </span>
            )}
            
            {hasEnhancedData && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Star className="h-2 w-2 mr-1" />
                Enhanced Details
              </span>
            )}
          </div>
        </div>

        {/* Charity Description */}
        {charity.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {charity.description}
          </p>
        )}

        {/* Location and Registration Info */}
        {(charityLocation || charity.registration_number) && (
          <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
            {charityLocation && (
              <div className="flex items-center">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{charityLocation}</span>
              </div>
            )}
            {charity.registration_number && isRegistered && (
              <div className="flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                <span>Reg: {charity.registration_number}</span>
              </div>
            )}
          </div>
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
        <div className="pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center justify-between">
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
          
          {/* JustGiving Profile Link */}
          {charity.profile_page_url && (
            <div className="flex items-center justify-center">
              <a 
                href={charity.profile_page_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-blue-600 flex items-center px-3 py-1 rounded-full border border-gray-200 hover:border-blue-300 transition-colors"
              >
                <Globe className="h-3 w-3 mr-1" />
                Visit JustGiving Profile
                <ExternalLink className="h-2 w-2 ml-1" />
              </a>
            </div>
          )}
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