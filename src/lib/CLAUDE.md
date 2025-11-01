# Library Utilities - Powered by Donation

## Core Libraries

### JustGiving Integration (`justgiving/`)
Complete JustGiving API integration for charitable donations.

#### `client.ts` - API Client
```typescript
// Key methods
getDonationByReference(reference: string)  // Status checking
generateDonationUrl(charityId, amount, reference)  // URL creation

// Environment variables
JUSTGIVING_API_KEY                    // API access key
NEXT_PUBLIC_JUSTGIVING_CHARITY_CHECKOUT_URL  // Donation URL override
```

#### API Features
- **Staging Environment**: Uses `link.staging.justgiving.com` for testing
- **Status Polling**: Reference-based donation status checking
- **Error Handling**: 404 handling for pending donations
- **URL Generation**: Parameterized donation URLs with return handling

### Supabase Integration (`supabase/`)
Database and authentication client configuration.

#### `client.ts` - Browser Client
```typescript
// Client-side Supabase instance
const supabase = createClient(url, anonKey)

// Usage in components
const { data, error } = await supabase
  .from('services')
  .select('*')
  .eq('platform', 'justgiving');
```

#### `server.ts` - Server Client  
```typescript
// Server-side Supabase with cookies
const supabase = createServerClient(url, anonKey, { cookies })

// Usage in API routes and server components
```

#### `middleware.ts` - Auth Middleware
```typescript
// Route protection and user session handling
// Automatic token refresh
// Redirect logic for protected routes
```

## Utility Functions

### Currency Handling (`currency.ts`)
```typescript
// Format donation amounts consistently
formatPrice(amount: number, currency: string = 'GBP'): string

// Examples
formatPrice(50, 'GBP')   // "£50"
formatPrice(100, 'USD')  // "$100"
```

### Distance Calculations (`utils/distance.ts`)
```typescript
// Calculate distance between coordinates
calculateDistance(lat1, lon1, lat2, lon2): number

// Usage for location-based service filtering
const distance = calculateDistance(
  userLat, userLon, 
  serviceLat, serviceLon
);
```

### General Utilities (`utils.ts`)
```typescript
// Common utility functions
cn(...classes)           // Tailwind class merging
formatDate(date)         // Consistent date formatting
generateSlug(text)       // URL-safe slugs
validateEmail(email)     // Email validation
```

## Environment Configuration

### Environment Validation (`env-validation.ts`)
```typescript
// Type-safe environment variable validation
const env = {
  NEXT_PUBLIC_SUPABASE_URL: string,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string,
  JUSTGIVING_API_KEY: string,
  // ... other required env vars
}

// Validates at build time and runtime
```

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

# JustGiving
JUSTGIVING_API_KEY=""
NEXT_PUBLIC_JUSTGIVING_CHARITY_CHECKOUT_URL=""

# App Configuration  
NEXT_PUBLIC_APP_URL=""
```

## API Integration Patterns

### Donation Flow
```typescript
// 1. Create service request with platform reference
const response = await fetch('/api/just-giving/charity/123', {
  method: 'POST',
  body: JSON.stringify({ serviceId, amount })
});

// 2. Get donation URL from response  
const { donationUrl, reference } = await response.json();

// 3. Redirect to JustGiving
window.location.href = donationUrl;

// 4. Handle return via donation-success page
// 5. Automated status polling via cron job
```

### Error Handling Patterns
```typescript
// API error wrapper
async function apiCall(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Performance Optimizations

### Caching Strategies
- **Charity Data**: Local cache tables reduce API calls
- **Static Data**: Next.js static generation for service/charity pages
- **API Responses**: Appropriate cache headers for public data

### Bundle Optimization
- **Tree Shaking**: Only import required functions
- **Code Splitting**: Dynamic imports for large libraries
- **External Dependencies**: Minimize bundle size impact

## Security Considerations

### API Key Management
- **Client vs Server**: Public keys for client, private keys for server
- **Environment Variables**: Never commit secrets to repository
- **Key Rotation**: Plan for periodic key updates

### Data Validation
```typescript
// Input validation for all API endpoints
const schema = z.object({
  amount: z.number().positive(),
  charityId: z.string().uuid(),
  serviceId: z.string().uuid()
});

const validated = schema.parse(requestBody);
```

### CORS Configuration
```typescript
// API route CORS headers
const headers = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};
```

## Testing Utilities

### Mock Clients
```typescript
// Mock Supabase for testing
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({ data: [], error: null })),
    insert: jest.fn(() => ({ data: [], error: null }))
  }))
};
```

### Test Helpers
```typescript
// Create test users, services, donations
export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  preferred_platform: 'justgiving',
  ...overrides
});
```

## Development Workflow

### Local Development
1. **Environment Setup**: Copy `.env.example` to `.env.local`
2. **Supabase Local**: Run `supabase start` for local development
3. **API Testing**: Use tools like Postman or curl for API endpoint testing
4. **Type Safety**: Run `pnpm build` to check TypeScript compilation

### Production Deployment
1. **Environment Variables**: Set in Vercel dashboard
2. **Database Migrations**: Apply via Supabase dashboard
3. **API Keys**: Rotate and update as needed
4. **Monitoring**: Use Vercel and Supabase logging for issue tracking

## Current Library Status
✅ **JustGiving Integration**: Complete API client with status checking
✅ **Supabase Setup**: Browser, server, and middleware clients configured
✅ **Utility Functions**: Currency, distance, validation, and formatting
✅ **Environment Validation**: Type-safe configuration management
✅ **Performance Optimized**: Caching, bundling, and security best practices