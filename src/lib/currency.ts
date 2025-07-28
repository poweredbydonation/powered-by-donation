// Utility for consistent currency formatting across server and client
export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  } catch (error) {
    // Fallback for cases where Intl.NumberFormat fails
    return `$${amount}`
  }
}

// Utility for consistent number formatting
export function formatNumber(num: number): string {
  try {
    return new Intl.NumberFormat('en-AU').format(num)
  } catch (error) {
    // Fallback for cases where Intl.NumberFormat fails
    return num.toString()
  }
}