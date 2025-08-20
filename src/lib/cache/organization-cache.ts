/**
 * Organization Result Caching
 * Based on Apache Superset's caching patterns for large datasets
 */

interface CacheKey {
  platform: string;
  page: number;
  limit: number;
  filters: Record<string, any>;
}

interface CachedResult {
  data: any; // Can be array or full response object
  timestamp: number;
  expiresAt: number;
}

// Cache TTL: 5 minutes for active data, 1 hour for static data
const CACHE_TTL_ACTIVE = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_STATIC = 60 * 60 * 1000; // 1 hour

// In-memory cache (in production, use Redis)
const resultCache = new Map<string, CachedResult>();

export function generateCacheKey(params: CacheKey): string {
  // Create deterministic cache key
  const filterKey = JSON.stringify(params.filters, Object.keys(params.filters).sort());
  return `org:${params.platform}:p${params.page}:l${params.limit}:${btoa(filterKey).slice(0, 16)}`;
}

export function getCachedResult(cacheKey: string): any | null {
  const cached = resultCache.get(cacheKey);
  
  if (!cached) return null;
  
  // Check if expired
  if (Date.now() > cached.expiresAt) {
    resultCache.delete(cacheKey);
    return null;
  }
  
  return cached.data;
}

export function setCachedResult(cacheKey: string, data: any, isStatic = false): void {
  const ttl = isStatic ? CACHE_TTL_STATIC : CACHE_TTL_ACTIVE;
  const expiresAt = Date.now() + ttl;
  
  resultCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    expiresAt
  });
  
  // Clean old cache entries periodically
  if (resultCache.size > 1000) {
    cleanExpiredCache();
  }
}

function cleanExpiredCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  resultCache.forEach((cached, key) => {
    if (now > cached.expiresAt) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => resultCache.delete(key));
}

// Cache warming function for popular pages
export function warmCache(platform: string, popularFilters: Record<string, any>[] = [{}]): void {
  // Warm first 3 pages for each popular filter combination
  const pages = [1, 2, 3];
  const limit = 12;
  
  for (const filters of popularFilters) {
    for (const page of pages) {
      const cacheKey = generateCacheKey({ platform, page, limit, filters });
      // This would trigger a background cache population
      console.log(`Warming cache for: ${cacheKey}`);
    }
  }
}

export default {
  get: getCachedResult,
  set: setCachedResult,
  generateKey: generateCacheKey,
  warm: warmCache
};