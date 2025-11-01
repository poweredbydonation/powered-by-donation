'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PricingTier, CurrencyCode } from '@/types/database'

interface PricingTierSliderProps {
  selectedTierId: number | null
  onTierSelect: (tier: PricingTier) => void
  userCurrency: CurrencyCode
  className?: string
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  CAD: 'C$',
  AUD: 'A$',
  EUR: '€'
}

export default function PricingTierSlider({ 
  selectedTierId, 
  onTierSelect, 
  userCurrency,
  className = '' 
}: PricingTierSliderProps) {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const { data, error } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('is_active', true)
          .order('tier_order', { ascending: true })

        if (error) {
          console.error('Error fetching pricing tiers:', error)
        } else {
          setTiers(data || [])
        }
      } catch (err) {
        console.error('Error in fetchTiers:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTiers()
  }, [supabase])

  const getPrice = (tier: PricingTier): number => {
    switch (userCurrency) {
      case 'GBP': return tier.price_gbp
      case 'USD': return tier.price_usd
      case 'CAD': return tier.price_cad
      case 'AUD': return tier.price_aud
      case 'EUR': return tier.price_eur
      default: return tier.price_gbp
    }
  }

  const formatPrice = (tier: PricingTier): string => {
    const symbol = CURRENCY_SYMBOLS[userCurrency]
    const price = getPrice(tier)
    return `${symbol}${price}`
  }

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700">
        Donation Amount *
      </label>
      
      <div className="space-y-3">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedTierId === tier.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onTierSelect(tier)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="pricing-tier"
                    value={tier.id}
                    checked={selectedTierId === tier.id}
                    onChange={() => onTierSelect(tier)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {tier.tier_name}
                    </h3>
                    <p className="text-sm text-gray-600">{tier.use_case}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatPrice(tier)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <p className="text-sm text-gray-500">
        Select a donation amount tier that matches the complexity of your service.
      </p>
    </div>
  )
}