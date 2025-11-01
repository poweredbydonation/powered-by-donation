/**
 * Every.org API Client
 * Handles nonprofit search, browsing, and details retrieval
 */

export interface EveryOrgNonprofit {
  id?: string;
  name: string;
  primarySlug?: string;
  ein: string;
  description: string;
  descriptionLong?: string | null;
  logoUrl: string;
  coverImageUrl?: string;
  profileUrl: string;
  websiteUrl?: string;
  locationAddress?: string;
  nteeCode?: string;
  nteeCodeMeaning?: {
    majorCode: string;
    majorMeaning: string;
    decileCode: string;
    decileMeaning: string;
  };
  matchedTerms?: string[];
  tags?: string[];
  isDisbursable?: boolean;
}

export interface EveryOrgSearchResponse {
  nonprofits: EveryOrgNonprofit[];
}

export interface EveryOrgBrowseResponse {
  nonprofits: EveryOrgNonprofit[];
  pagination: {
    page: number;
    pages: number;
    page_size: number;
    total_results: number;
  };
}

export interface EveryOrgDetailsResponse {
  data: {
    nonprofit: EveryOrgNonprofit;
    nonprofitTags: Array<{
      id: string;
      tagName: string;
      causeCategory: string;
      title: string;
      tagImageUrl: string;
      tagUrl: string;
    }>;
  };
}

class EveryOrgClient {
  private readonly baseUrl: string;
  private readonly publicKey: string;

  constructor(publicKey?: string) {
    this.baseUrl = process.env.NEXT_PUBLIC_EVERYORG_API_URL || 'https://partners.every.org';
    this.publicKey = publicKey || process.env.NEXT_PUBLIC_EVERYORG_PUBLIC_KEY || process.env.EVERYORG_PUBLIC_KEY || '';
    
    if (!this.publicKey) {
      throw new Error('Every.org public key is required');
    }
  }

  /**
   * Get details about a specific nonprofit
   */
  async getNonprofit(identifier: string): Promise<EveryOrgNonprofit | null> {
    try {
      const url = `${this.baseUrl}/v0.2/nonprofit/${identifier}?apiKey=${this.publicKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Every.org API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data: EveryOrgDetailsResponse = await response.json();
      return data.data.nonprofit;
    } catch (error) {
      console.error('Error fetching nonprofit details:', error);
      return null;
    }
  }

  /**
   * Search for nonprofits by term
   */
  async searchNonprofits(
    searchTerm: string, 
    options: {
      take?: number;
      causes?: string[];
    } = {}
  ): Promise<EveryOrgNonprofit[]> {
    try {
      const params = new URLSearchParams({
        apiKey: this.publicKey,
        ...(options.take && { take: options.take.toString() }),
        ...(options.causes && options.causes.length > 0 && { causes: options.causes.join(',') })
      });
      
      const url = `${this.baseUrl}/v0.2/search/${encodeURIComponent(searchTerm)}?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Every.org search API error: ${response.status} ${response.statusText}`);
        return [];
      }
      
      const data: EveryOrgSearchResponse = await response.json();
      return data.nonprofits;
    } catch (error) {
      console.error('Error searching nonprofits:', error);
      return [];
    }
  }

  /**
   * Browse nonprofits by cause
   */
  async browseNonprofits(
    cause: string,
    options: {
      take?: number;
      page?: number;
    } = {}
  ): Promise<EveryOrgBrowseResponse | null> {
    try {
      const params = new URLSearchParams({
        apiKey: this.publicKey,
        ...(options.take && { take: options.take.toString() }),
        ...(options.page && { page: options.page.toString() })
      });
      
      const url = `${this.baseUrl}/v0.2/browse/${encodeURIComponent(cause)}?${params}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`Every.org browse API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data: EveryOrgBrowseResponse = await response.json();
      
      return data;
    } catch (error) {
      console.error('Error browsing nonprofits:', error);
      return null;
    }
  }

  /**
   * Every.org browse categories - only confirmed working ones
   */
  getPopularCauses(): string[] {
    return [
      // Confirmed working (834 pages each)
      'animals',        
      'education',      
      'environment',    
      'health',         
      'humans',         
      'religion',       
      
      // Additional working categories
      'climate',        
      'housing',        
      'justice',        
      'poverty',        
      'research',       
      'veterans',       
      'youth'
      
      // Removed non-working: arts, community, disaster, hunger, women
    ];
  }
}

// Create a function to get the client instance
export function getEveryOrgClient(publicKey?: string): EveryOrgClient {
  return new EveryOrgClient(publicKey);
}

// Export a default client for server-side usage
export const everyOrgClient = {
  getNonprofit: (identifier: string) => getEveryOrgClient().getNonprofit(identifier),
  searchNonprofits: (searchTerm: string, options = {}) => getEveryOrgClient().searchNonprofits(searchTerm, options),
  browseNonprofits: (cause: string, options = {}) => getEveryOrgClient().browseNonprofits(cause, options),
  getPopularCauses: () => getEveryOrgClient().getPopularCauses(),
};