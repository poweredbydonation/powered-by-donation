/**
 * JustGiving Charity Data Synchronization
 * Handles syncing charity information with our database
 */

import { createClient } from '@/lib/supabase/server'
import { justGivingAPI, JustGivingCharity } from './client'

export interface CharityCacheData {
  justgiving_charity_id: string
  name: string
  description: string | null
  category: string | null
  logo_url: string | null
  slug: string
  total_donations_count: number
  total_amount_received: number
  this_month_count: number
  this_month_amount: number
  service_categories: Record<string, number>
  is_active: boolean
  is_featured: boolean
  page_views: number
  last_updated: string
  stats_last_updated: string
}

/**
 * Sync a single charity's data from JustGiving API to our database
 */
export async function syncCharityData(charityId: number): Promise<CharityCacheData | null> {
  try {
    const supabase = createClient()
    
    // Fetch charity data from JustGiving API
    const charityData = await justGivingAPI.getCharityById(charityId)
    
    if (!charityData) {
      console.warn(`No charity data found for ID: ${charityId}`)
      return null
    }

    // Generate SEO-friendly slug
    const slug = justGivingAPI.generateCharitySlug(charityData.name)
    
    // Prepare charity data for database
    const charityRecord: Partial<CharityCacheData> = {
      justgiving_charity_id: charityId.toString(),
      name: charityData.name,
      description: charityData.description || null,
      category: charityData.subCategory || null,
      logo_url: charityData.logoAbsoluteUrl || null,
      slug,
      is_active: true,
      is_featured: false,
      last_updated: new Date().toISOString()
    }

    // Check if charity already exists
    const { data: existingCharity } = await supabase
      .from('justgiving_charity_cache')
      .select('*')
      .eq('justgiving_charity_id', charityId.toString())
      .single()

    let result
    if (existingCharity) {
      // Update existing charity (preserve stats)
      const { data, error } = await supabase
        .from('justgiving_charity_cache')
        .update({
          name: charityRecord.name,
          description: charityRecord.description,
          category: charityRecord.category,
          logo_url: charityRecord.logo_url,
          slug: charityRecord.slug,
          is_active: charityRecord.is_active,
          last_updated: charityRecord.last_updated
        })
        .eq('justgiving_charity_id', charityId.toString())
        .select()
        .single()

      if (error) {
        console.error('Error updating charity:', error)
        return null
      }
      result = data
    } else {
      // Insert new charity
      const { data, error } = await supabase
        .from('justgiving_charity_cache')
        .insert({
          ...charityRecord,
          total_donations_count: 0,
          total_amount_received: 0,
          this_month_count: 0,
          this_month_amount: 0,
          service_categories: {},
          page_views: 0,
          stats_last_updated: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting charity:', error)
        return null
      }
      result = data
    }

    console.log(`Successfully synced charity: ${charityData.name} (ID: ${charityId})`)
    return result
    
  } catch (error) {
    console.error(`Error syncing charity ${charityId}:`, error)
    return null
  }
}

/**
 * Bulk sync multiple charities
 */
export async function syncMultipleCharities(charityIds: number[]): Promise<CharityCacheData[]> {
  const results: CharityCacheData[] = []
  
  // Process charities one by one to avoid rate limiting
  for (const charityId of charityIds) {
    try {
      const result = await syncCharityData(charityId)
      if (result) {
        results.push(result)
      }
      
      // Add small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`Failed to sync charity ${charityId}:`, error)
    }
  }
  
  return results
}

/**
 * Search for charities and optionally sync the first few results
 */
export async function searchAndSyncCharities(
  searchTerm: string, 
  maxResults: number = 10,
  syncResults: boolean = true
): Promise<{ searchResults: JustGivingCharity[], syncedResults: CharityCacheData[] }> {
  try {
    // Search for charities
    const searchResponse = await justGivingAPI.searchCharities(searchTerm, maxResults)
    const searchResults = searchResponse.charitySearchResults || []
    
    let syncedResults: CharityCacheData[] = []
    
    if (syncResults && searchResults.length > 0) {
      // Extract charity IDs and sync them
      const charityIds = searchResults.map(charity => charity.charityId)
      syncedResults = await syncMultipleCharities(charityIds)
    }
    
    return {
      searchResults,
      syncedResults
    }
  } catch (error) {
    console.error('Error in searchAndSyncCharities:', error)
    return {
      searchResults: [],
      syncedResults: []
    }
  }
}

/**
 * Validate charity exists in JustGiving and sync if valid
 */
export async function validateAndSyncCharity(charityId: number): Promise<boolean> {
  try {
    const isValid = await justGivingAPI.validateCharity(charityId)
    
    if (isValid) {
      const syncResult = await syncCharityData(charityId)
      return !!syncResult
    }
    
    return false
  } catch (error) {
    console.error(`Error validating charity ${charityId}:`, error)
    return false
  }
}

/**
 * Get cached charity data or sync from JustGiving if not found
 */
export async function getOrSyncCharity(charityId: number): Promise<CharityCacheData | null> {
  try {
    const supabase = createClient()
    
    // First, try to get from cache
    const { data: cachedCharity } = await supabase
      .from('justgiving_charity_cache')
      .select('*')
      .eq('justgiving_charity_id', charityId.toString())
      .single()
    
    if (cachedCharity) {
      // Check if data is fresh (less than 24 hours old)
      const lastUpdated = new Date(cachedCharity.last_updated)
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      if (lastUpdated > dayAgo) {
        return cachedCharity
      }
    }
    
    // Data is stale or doesn't exist, sync from JustGiving
    console.log(`Syncing fresh data for charity ${charityId}`)
    return await syncCharityData(charityId)
    
  } catch (error) {
    console.error(`Error in getOrSyncCharity for ${charityId}:`, error)
    return null
  }
}