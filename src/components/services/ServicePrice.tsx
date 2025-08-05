'use client'

import { useServicePrice } from '@/hooks/useServicePrice'
import { CurrencyCode } from '@/types/database'

interface ServicePriceProps {
  pricingTierId: number | null | undefined
  userCurrency: CurrencyCode
  className?: string
  showTierName?: boolean
}

export default function ServicePrice({ 
  pricingTierId, 
  userCurrency, 
  className = '',
  showTierName = false 
}: ServicePriceProps) {
  const { formattedPrice, tier, loading, error } = useServicePrice(pricingTierId, userCurrency)

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-6 bg-gray-200 rounded w-16"></div>
      </div>
    )
  }

  if (error || !formattedPrice) {
    return (
      <span className={`text-gray-500 ${className}`}>
        Price unavailable
      </span>
    )
  }

  return (
    <span className={className}>
      {formattedPrice}
      {showTierName && tier && (
        <span className="text-sm text-gray-500 ml-2">
          ({tier.tier_name})
        </span>
      )}
    </span>
  )
}