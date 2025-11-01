import { User } from '@/types/database'

/**
 * Compute user roles from terms acceptance timestamps
 * This allows us to derive is_fundraiser and is_donor from the new timestamp columns
 */
export function computeUserRoles(user: User): User {
  return {
    ...user,
    is_fundraiser: !!user.fundraiser_service_terms_accepted_time,
    is_donor: !!(user.donor_service_terms_accepted_time || user.donor_organization_terms_accepted_time)
  }
}

/**
 * Check if user has accepted specific terms
 */
export function hasAcceptedTerms(
  user: User, 
  termsType: 'fundraiser_service' | 'donor_service' | 'donor_organization'
): boolean {
  switch (termsType) {
    case 'fundraiser_service':
      return !!user.fundraiser_service_terms_accepted_time
    case 'donor_service':
      return !!user.donor_service_terms_accepted_time
    case 'donor_organization':
      return !!user.donor_organization_terms_accepted_time
    default:
      return false
  }
}

/**
 * Get terms acceptance timestamp
 */
export function getTermsAcceptedTime(
  user: User,
  termsType: 'fundraiser_service' | 'donor_service' | 'donor_organization'
): Date | null {
  let timestamp: string | undefined
  
  switch (termsType) {
    case 'fundraiser_service':
      timestamp = user.fundraiser_service_terms_accepted_time
      break
    case 'donor_service':
      timestamp = user.donor_service_terms_accepted_time
      break
    case 'donor_organization':
      timestamp = user.donor_organization_terms_accepted_time
      break
  }
  
  return timestamp ? new Date(timestamp) : null
}

/**
 * Get user role display string
 */
export function getUserRoleDisplay(user: User): string {
  const roles: string[] = []
  
  if (user.fundraiser_service_terms_accepted_time) {
    roles.push('Fundraiser')
  }
  
  if (user.donor_service_terms_accepted_time || user.donor_organization_terms_accepted_time) {
    roles.push('Donor')
  }
  
  return roles.length > 0 ? roles.join(', ') : 'No roles'
}

/**
 * Update user with terms acceptance
 */
export function acceptTerms(
  termsType: 'fundraiser_service' | 'donor_service' | 'donor_organization'
): Record<string, string> {
  const now = new Date().toISOString()
  
  switch (termsType) {
    case 'fundraiser_service':
      return { fundraiser_service_terms_accepted_time: now }
    case 'donor_service':
      return { donor_service_terms_accepted_time: now }
    case 'donor_organization':
      return { donor_organization_terms_accepted_time: now }
    default:
      return {}
  }
}