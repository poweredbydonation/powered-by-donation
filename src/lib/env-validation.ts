// Environment variable validation
export function validateEnvVars() {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const missingVars: string[] = []
  const invalidVars: string[] = []

  Object.entries(requiredVars).forEach(([key, value]) => {
    if (!value) {
      missingVars.push(key)
    } else if (value.includes(' ')) {
      invalidVars.push(`${key} contains spaces`)
    } else if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !value.startsWith('https://')) {
      invalidVars.push(`${key} should start with https://`)
    } else if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !value.startsWith('eyJ')) {
      invalidVars.push(`${key} should be a valid JWT token starting with 'eyJ'`)
    }
  })

  if (missingVars.length > 0) {
    console.error('Missing environment variables:', missingVars)
  }

  if (invalidVars.length > 0) {
    console.error('Invalid environment variables:', invalidVars)
  }

  if (missingVars.length > 0 || invalidVars.length > 0) {
    console.error('Please check your .env.local file and restart the development server.')
    return false
  }

  console.log('✅ Environment variables validated successfully')
  return true
}