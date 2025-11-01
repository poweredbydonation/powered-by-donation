/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Check if a service location is within the specified radius of a user location
 * @param userLocation User's selected location
 * @param serviceLocation Service's location data
 * @param radiusKm Search radius in kilometers
 * @returns true if service is within radius, false otherwise
 */
export function isServiceWithinRadius(
  userLocation: { lat: number; lng: number },
  serviceLocation: { latitude?: number; longitude?: number; type: string },
  radiusKm: number
): boolean {
  // Remote services are always accessible regardless of location
  if (serviceLocation.type === 'remote') {
    return true
  }
  
  // Physical and hybrid services need location check
  if (!serviceLocation.latitude || !serviceLocation.longitude) {
    return false // Service has no location data
  }
  
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    serviceLocation.latitude,
    serviceLocation.longitude
  )
  
  return distance <= radiusKm
}