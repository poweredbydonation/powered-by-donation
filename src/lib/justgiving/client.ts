/**
 * JustGiving API Client
 * Handles charity search and validation for the Powered by Donation platform
 */

export interface JustGivingCharity {
  charityId: number
  name: string
  description: string
  logoAbsoluteUrl?: string
  profilePageUrl?: string
  website?: string
  registeredCharityNumber?: string
  subCategory?: string
  country?: string
}

export interface CharitySearchResponse {
  charitySearchResults: JustGivingCharity[]
  totalItemsCount: number
}

export interface FundraiserSearchResult {
  pageTitle: string
  pageShortName: string
  pageUrl: string
  pageOwner: string
  charityId: number
  eventId?: number
  eventName?: string
  raisedAmount: number
  targetAmount: number
  pageStory: string
  pageSummary: string
  charityName: string
}

export interface FundraiserSearchResponse {
  fundraisingSearchResults: FundraiserSearchResult[]
  totalItemsCount: number
}

export interface JustGivingDonation {
  donationId: string
  donationRef: string
  donorName: string
  donationAmount: number
  currencyCode: string
  donationDate: string
  charityId: number
  donationStatus: 'Accepted' | 'Pending' | 'Rejected'
}

export interface DonationByReferenceResponse {
  donation: JustGivingDonation | null
  found: boolean
}

class JustGivingAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    // Use environment variables with fallback to staging
    this.apiKey = process.env.JUSTGIVING_API_KEY || 'd01c672d'
    this.baseUrl = process.env.JUSTGIVING_API_URL || 'https://api.staging.justgiving.com'
  }

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', data?: any): Promise<T> {
    const fullUrl = `${this.baseUrl}/${this.apiKey}${endpoint}`
    console.log('Making JustGiving API request to:', fullUrl)
    
    const config: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(fullUrl, config)
      
      console.log('JustGiving API response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('JustGiving API error response:', errorText)
        throw new Error(`JustGiving API error! status: ${response.status}, message: ${errorText}`)
      }
      
      const jsonData = await response.json()
      console.log('JustGiving API JSON response:', jsonData)
      
      // Transform fundraiser response to match expected format
      if (endpoint.includes('/fundraising/search') && jsonData.SearchResults) {
        return {
          fundraisingSearchResults: jsonData.SearchResults.map((item: any) => ({
            pageTitle: item.PageName,
            pageShortName: item.PageUrl ? item.PageUrl.split('/').pop() : '',
            pageUrl: item.PageUrl,
            pageOwner: item.PageOwner,
            charityId: item.CharityId,
            eventId: item.EventId,
            eventName: item.EventName,
            raisedAmount: item.RaisedAmount,
            targetAmount: item.TargetAmount,
            pageStory: `Fundraising page by ${item.PageOwner}`,
            pageSummary: item.EventName || `Supporting charity ID ${item.CharityId}`,
            charityName: item.EventName
          })),
          totalItemsCount: jsonData.numberOfHits || jsonData.SearchResults.length
        } as T
      }
      
      return jsonData
    } catch (error) {
      console.error('JustGiving API request failed:', error)
      throw error
    }
  }

  /**
   * Search for charities by name or keyword
   */
  async searchCharities(searchTerm: string, pageSize: number = 20): Promise<CharitySearchResponse> {
    const endpoint = `/v1/charity/search?q=${encodeURIComponent(searchTerm)}&pageSize=${pageSize}`
    return this.makeRequest<CharitySearchResponse>(endpoint)
  }

  /**
   * Get detailed information about a specific charity by ID
   */
  async getCharityById(charityId: number): Promise<JustGivingCharity> {
    const endpoint = `/v1/charity/${charityId}`
    return this.makeRequest<JustGivingCharity>(endpoint)
  }

  /**
   * Search for fundraising pages
   */
  async searchFundraisers(searchTerm: string, pageSize: number = 20): Promise<FundraiserSearchResponse> {
    const endpoint = `/v1/fundraising/search?q=${encodeURIComponent(searchTerm)}&pageSize=${pageSize}`
    return this.makeRequest<FundraiserSearchResponse>(endpoint)
  }

  /**
   * Validate that a charity exists and is active
   */
  async validateCharity(charityId: number): Promise<boolean> {
    try {
      await this.getCharityById(charityId)
      return true
    } catch (error) {
      console.warn(`Charity ${charityId} validation failed:`, error)
      return false
    }
  }

  /**
   * Generate a URL-friendly slug from charity name
   */
  generateCharitySlug(charityName: string): string {
    return charityName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
  }

  /**
   * Get donation status by reference ID
   * Used by server-side polling to check if pending donations are completed
   */
  async getDonationByReference(reference: string): Promise<DonationByReferenceResponse> {
    const endpoint = `/v1/donation/ref/${encodeURIComponent(reference)}`
    
    try {
      const donation = await this.makeRequest<JustGivingDonation>(endpoint)
      return {
        donation,
        found: true
      }
    } catch (error: any) {
      // JustGiving returns 404 if donation not found yet (still pending)
      if (error.message?.includes('status: 404')) {
        console.log(`Donation with reference ${reference} not found yet (likely still pending)`)
        return {
          donation: null,
          found: false
        }
      }
      
      // Re-throw other errors (network issues, auth problems, etc.)
      console.error(`Error checking donation status for reference ${reference}:`, error)
      throw error
    }
  }

  /**
   * Get the donation URL for a charity
   */
  getCharityDonationUrl(charityId: number, amount?: number, reference?: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_JUSTGIVING_CHARITY_CHECKOUT_URL || 'https://link.staging.justgiving.com'
    const returnUrl = process.env.NEXT_PUBLIC_JUSTGIVING_RETURN_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // JustGiving staging URL format: https://link.staging.justgiving.com/v1/charity/donate/charityId/{charityId}
    let url = `${baseUrl}/v1/charity/donate/charityId/${charityId}`
    
    const params = new URLSearchParams()
    if (amount) {
      params.append('donationValue', amount.toString())
    }
    params.append('currency', 'GBP') // JustGiving requires currency
    params.append('exiturl', `${returnUrl}/en/donation-success?jgDonationId=JUSTGIVING-DONATION-ID`)
    if (reference) {
      params.append('reference', reference)
    }
    params.append('skipGiftAid', 'true') // For international donors
    
    url += `?${params.toString()}`
    
    console.log('🔗 Generated JustGiving URL:', url)
    return url
  }
}

// Export singleton instance
export const justGivingAPI = new JustGivingAPI()