/**
 * Charity Database Population
 * Populates charity_cache with popular Australian charities
 */

import { syncMultipleCharities, searchAndSyncCharities } from './sync'

// Popular Australian charity search terms for comprehensive coverage
const POPULAR_CHARITY_SEARCHES = [
  // Health & Medical
  'cancer research',
  'cancer council',
  'heart foundation',
  'diabetes',
  'mental health',
  'beyond blue',
  'lifeline',
  'headspace',
  
  // Children & Youth
  'children',
  'kids',
  'child',
  'youth',
  'starlight',
  'make a wish',
  'save the children',
  
  // Animal Welfare
  'rspca',
  'animal',
  'wildlife',
  'dog',
  'cat',
  'rescue',
  
  // Environment
  'environment',
  'conservation',
  'wildlife',
  'greenpeace',
  'wwf',
  
  // Community & Social
  'homeless',
  'salvation army',
  'red cross',
  'oxfam',
  'community',
  'food',
  'housing',
  
  // Education
  'education',
  'school',
  'literacy',
  'university',
  
  // Disability
  'disability',
  'autism',
  'vision',
  'hearing',
  
  // Indigenous
  'indigenous',
  'aboriginal',
  'reconciliation',
  
  // International Aid
  'world vision',
  'unicef',
  'aid',
  'poverty',
  'water'
]

// Known high-impact Australian charity IDs to ensure they're cached
const PRIORITY_CHARITY_IDS = [
  2050,    // Great Ormond Street Hospital (popular internationally)
  183092,  // Cancer Research UK
  114015,  // British Red Cross
  2357,    // RSPCA
  2423,    // Oxfam
  // Add more known Australian charity IDs as discovered
]

/**
 * Populate charity cache with comprehensive charity data
 */
export async function populateCharityCache(): Promise<{
  searchResults: number
  priorityResults: number
  totalCharities: number
  errors: string[]
}> {
  console.log('🚀 Starting charity cache population...')
  
  const results = {
    searchResults: 0,
    priorityResults: 0,
    totalCharities: 0,
    errors: [] as string[]
  }

  // Step 1: Sync priority charities first
  console.log('📝 Syncing priority charity IDs...')
  try {
    const priorityCharities = await syncMultipleCharities(PRIORITY_CHARITY_IDS)
    results.priorityResults = priorityCharities.length
    console.log(`✅ Synced ${priorityCharities.length} priority charities`)
  } catch (error) {
    const errorMsg = `Failed to sync priority charities: ${error}`
    console.error(errorMsg)
    results.errors.push(errorMsg)
  }

  // Step 2: Search and sync based on popular terms
  console.log('🔍 Searching and syncing popular charity terms...')
  
  for (const searchTerm of POPULAR_CHARITY_SEARCHES) {
    try {
      console.log(`Searching for: "${searchTerm}"`)
      
      const searchResults = await searchAndSyncCharities(
        searchTerm, 
        10,  // Get top 10 results per search term
        true // Sync to database
      )
      
      results.searchResults += searchResults.syncedResults.length
      console.log(`  ✅ Found and synced ${searchResults.syncedResults.length} charities`)
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
      
    } catch (error) {
      const errorMsg = `Failed to search "${searchTerm}": ${error}`
      console.warn(errorMsg)
      results.errors.push(errorMsg)
    }
  }

  results.totalCharities = results.searchResults + results.priorityResults

  console.log('🎉 Charity cache population completed!')
  console.log(`📊 Summary:`)
  console.log(`   Priority charities: ${results.priorityResults}`)
  console.log(`   Search results: ${results.searchResults}`)
  console.log(`   Total cached: ${results.totalCharities}`)
  console.log(`   Errors: ${results.errors.length}`)

  if (results.errors.length > 0) {
    console.log('⚠️ Errors encountered:')
    results.errors.forEach(error => console.log(`   - ${error}`))
  }

  return results
}

/**
 * Quick population with essential charities only (for development)
 */
export async function populateEssentialCharities(): Promise<{
  totalCharities: number
  errors: string[]
}> {
  console.log('🚀 Starting essential charity cache population...')
  
  const results = {
    totalCharities: 0,
    errors: [] as string[]
  }

  // Just sync a few essential searches for quick testing
  const essentialSearches = [
    'cancer research',
    'children',
    'rspca',
    'red cross',
    'beyond blue'
  ]

  for (const searchTerm of essentialSearches) {
    try {
      console.log(`Searching for: "${searchTerm}"`)
      
      const searchResults = await searchAndSyncCharities(
        searchTerm, 
        5,   // Just 5 results per search
        true // Sync to database
      )
      
      results.totalCharities += searchResults.syncedResults.length
      console.log(`  ✅ Found and synced ${searchResults.syncedResults.length} charities`)
      
      // Short delay
      await new Promise(resolve => setTimeout(resolve, 300))
      
    } catch (error) {
      const errorMsg = `Failed to search "${searchTerm}": ${error}`
      console.warn(errorMsg)
      results.errors.push(errorMsg)
    }
  }

  console.log(`🎉 Essential charity cache population completed! Total: ${results.totalCharities}`)
  return results
}