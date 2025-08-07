'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PricingTier, CurrencyCode } from '@/types/database'

interface ServicePriceResult {
  price: number | null
  formattedPrice: string | null
  tier: PricingTier | null
  loading: boolean
  error: string | null
}

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GBP: '£',
  USD: '$',
  CAD: 'C$',
  AUD: 'A$',
  EUR: '€'
}

export function useServicePrice(pricingTierId: number | null | undefined, userCurrency: CurrencyCode): ServicePriceResult {
  const [tier, setTier] = useState<PricingTier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchTier = async () => {
      if (!pricingTierId) {
        setTier(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error: fetchError } = await supabase
          .from('pricing_tiers')
          .select('*')
          .eq('id', pricingTierId)
          .eq('is_active', true)
          .single()

        if (fetchError) {
          setError(fetchError.message)
          setTier(null)
        } else {
          setTier(data)
          setError(null)
        }
      } catch (err) {
        setError('Failed to fetch pricing tier')
        setTier(null)
      } finally {
        setLoading(false)
      }
    }

    fetchTier()
  }, [pricingTierId, supabase])

  const getPrice = (tier: PricingTier, currency: CurrencyCode): number => {
    switch (currency) {
      case 'GBP': return tier.price_gbp
      case 'USD': return tier.price_usd
      case 'CAD': return tier.price_cad
      case 'AUD': return tier.price_aud
      case 'EUR': return tier.price_eur
      default: return tier.price_aud // Fallback to AUD (our base)
    }
  }

  const formatPrice = (price: number, currency: CurrencyCode): string => {
    const symbol = CURRENCY_SYMBOLS[currency]
    return `${symbol}${price}`
  }

  const price = tier ? getPrice(tier, userCurrency) : null
  const formattedPrice = price !== null ? formatPrice(price, userCurrency) : null

  return {
    price,
    formattedPrice,
    tier,
    loading,
    error
  }
}