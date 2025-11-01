/**
 * Server-side functions for populating Every.org nonprofit cache
 */

import { createClient } from '@/lib/supabase/server';

export async function triggerEveryOrgCachePopulation(): Promise<{
  success: boolean;
  message: string;
  data?: any;
}> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    // Call the edge function
    const functionUrl = `${supabaseUrl}/functions/v1/populate-everyorg-nonprofit-cache`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: `Successfully populated ${result.total_processed} nonprofits`,
      data: result
    };
    
  } catch (error) {
    console.error('Error triggering Every.org cache population:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

export async function getEveryOrgCacheStats(): Promise<{
  total_nonprofits: number;
  last_updated: string | null;
  categories: { [key: string]: number };
}> {
  try {
    const supabase = createClient();
    
    // Get total count
    const { count: totalCount } = await supabase
      .from('every_org_nonprofit_cache')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Get last updated timestamp
    const { data: lastUpdated } = await supabase
      .from('every_org_nonprofit_cache')
      .select('last_updated')
      .eq('is_active', true)
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();
    
    // Get categories count
    const { data: categoriesData } = await supabase
      .from('every_org_nonprofit_cache')
      .select('category')
      .eq('is_active', true);
    
    const categories: { [key: string]: number } = {};
    categoriesData?.forEach(item => {
      const category = item.category || 'uncategorized';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return {
      total_nonprofits: totalCount || 0,
      last_updated: lastUpdated?.last_updated || null,
      categories
    };
    
  } catch (error) {
    console.error('Error getting Every.org cache stats:', error);
    return {
      total_nonprofits: 0,
      last_updated: null,
      categories: {}
    };
  }
}