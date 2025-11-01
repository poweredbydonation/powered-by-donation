/**
 * Background Preloader Component
 * Preloads API data to populate the React component cache
 */

'use client'

import { useEffect, useRef } from 'react'

interface BackgroundPreloaderProps {
  locale: string
  preloadUrls?: string[]
}

// Global cache that matches OrganizationBrowse component cache structure
const globalPreloadCache = new Map<string, {
  data: any
  timestamp: number
}>()

const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// Global flag to prevent multiple runs (survives React remounts)
let hasPreloaded = false
let timersStarted = false

// Make cache accessible globally for OrganizationBrowse component
if (typeof window !== 'undefined') {
  // Use a more persistent global reference
  if (!(window as any).__preloadCache) {
    (window as any).__preloadCache = globalPreloadCache
  }
  console.log('🌍 Global cache initialized on window:', !!(window as any).__preloadCache)
}

export default function BackgroundPreloader({ locale, preloadUrls = [] }: BackgroundPreloaderProps) {
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    console.log('🎯 BackgroundPreloader mounted!', { locale, hasPreloaded, timersStarted })
    
    // Only run once per session (global flag survives remounts)
    if (hasPreloaded || timersStarted) {
      console.log('⏭️ BackgroundPreloader already ran, skipping')
      return
    }
    timersStarted = true
    
    console.log('🚀 BackgroundPreloader starting...', { locale })

    const generateCacheKey = (platform: string, page: number) => {
      // Must match OrganizationBrowse key format exactly with actual default values:
      // `${platform}-${page}-${searchQuery}-${categoryFilter}-${cityFilter}-${stateFilter}-${featuredOnly}-${preferredOnly}-${purposeFilter}-${beneficiaryFilter}`
      return `${platform}-${page}-----false-false--` // actual defaults: empty strings for filters
    }

    const setCachedData = (cacheKey: string, data: any) => {
      const cacheEntry = {
        data,
        timestamp: Date.now()
      }
      
      // Store in memory cache
      globalPreloadCache.set(cacheKey, cacheEntry)
      
      // Also store in localStorage for persistence across page navigations
      try {
        const existingCache = localStorage.getItem('__preloadCache') || '{}'
        const parsedCache = JSON.parse(existingCache)
        parsedCache[cacheKey] = cacheEntry
        localStorage.setItem('__preloadCache', JSON.stringify(parsedCache))
        console.log('💾 Stored in localStorage:', cacheKey)
      } catch (error) {
        console.log('⚠️ localStorage failed:', error)
      }
    }

    const preloadAPI = async (apiUrl: string, platform: string, page: number) => {
      try {
        console.log(`📦 Background preloading API: ${apiUrl}`)
        const start = Date.now()
        
        // Fetch API data
        const response = await fetch(apiUrl)
        
        if (response.ok) {
          const data = await response.json()
          const time = Date.now() - start
          
          // Store in cache using the same key format as OrganizationBrowse
          const cacheKey = generateCacheKey(platform, page)
          setCachedData(cacheKey, data)
          
          console.log(`✅ Preloaded & cached API ${apiUrl} in ${time}ms (key: ${cacheKey})`)
          console.log(`📝 Cache now contains:`, Array.from(globalPreloadCache.keys()))
        }
      } catch (error) {
        console.log(`⚠️ Failed to preload API ${apiUrl}:`, error)
      }
    }

    const preloadNextJSPage = async (href: string) => {
      try {
        console.log(`🚀 Background preloading Next.js route: ${href}`)
        
        // Use Next.js router prefetch if available
        if (typeof window !== 'undefined' && (window as any).next?.router?.prefetch) {
          await (window as any).next.router.prefetch(href)
          console.log(`✅ Prefetched Next.js route: ${href}`)
        } else {
          // Fallback: just fetch the page
          const response = await fetch(href)
          if (response.ok) {
            await response.text()
            console.log(`✅ Preloaded page: ${href}`)
          }
        }
      } catch (error) {
        console.log(`⚠️ Failed to preload Next.js route ${href}:`, error)
      }
    }

    // API endpoints to preload (these will populate component cache)
    const apiPreloads = [
      { url: '/api/justgiving/organizations?page=1&limit=6', platform: 'justgiving', page: 1 },
      { url: '/api/justgiving/organizations?page=2&limit=6', platform: 'justgiving', page: 2 },
      { url: '/api/everyorg/organizations?page=1&limit=6', platform: 'everyorg', page: 1 },
    ]

    // Next.js routes to prefetch
    const routePreloads = [
      `/${locale}/justgiving/charities`,
      `/${locale}/everyorg/nonprofits`,
      `/${locale}/my/services`,
    ]

    // Start preloading after a delay to avoid blocking main page
    console.log('⏰ Setting up preload timers...', { apiCount: apiPreloads.length, routeCount: routePreloads.length })
    
    // Preload APIs first (most important)
    apiPreloads.forEach((item, index) => {
      const delay = 2000 + (index * 300) // Start after 2s, 300ms apart
      
      console.log(`⏲️ API timer ${index + 1}: ${delay}ms delay for ${item.url}`)
      
      const timeout = setTimeout(() => {
        console.log(`🕐 Timer fired for API: ${item.url}`)
        preloadAPI(item.url, item.platform, item.page)
      }, delay)
      
      // Store globally to prevent cleanup
      if (typeof window !== 'undefined') {
        (window as any).__preloadTimers = (window as any).__preloadTimers || []
        ;(window as any).__preloadTimers.push(timeout)
      }
      
      timeoutsRef.current.push(timeout)
    })

    // Preload routes second
    routePreloads.forEach((href, index) => {
      const delay = 3000 + (index * 500) // Start after 3s, 500ms apart
      
      const timeout = setTimeout(() => {
        console.log(`🕐 Timer fired for route: ${href}`)
        preloadNextJSPage(href)
      }, delay)
      
      // Store globally to prevent cleanup
      if (typeof window !== 'undefined') {
        (window as any).__preloadTimers = (window as any).__preloadTimers || []
        ;(window as any).__preloadTimers.push(timeout)
      }
      
      timeoutsRef.current.push(timeout)
    })

    // Mark as successfully started
    hasPreloaded = true
    
    // Don't cleanup timers - let them run globally
    return () => {
      console.log('🧹 Component cleanup (timers preserved globally)')
    }
  }, [locale, preloadUrls])

  // This component renders nothing
  return null
}