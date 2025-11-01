'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { ServiceLocation } from '@/types/database'

interface ServiceLocationMapProps {
  locations: ServiceLocation[]
  className?: string
}

export default function ServiceLocationMap({
  locations,
  className = ''
}: ServiceLocationMapProps) {
  // Filter to only physical and hybrid locations that have coordinates
  const mappableLocations = locations.filter(
    location => 
      (location.type === 'physical' || location.type === 'hybrid') &&
      location.latitude && 
      location.longitude
  )

  // If no mappable locations, don't render the map
  if (mappableLocations.length === 0) {
    return null
  }

  // Use the first location as the center
  const primaryLocation = mappableLocations[0]
  const center = {
    lat: primaryLocation.latitude!,
    lng: primaryLocation.longitude!
  }

  // Service location circles component
  const ServiceLocationCircles = () => {
    const map = useMap()
    const circlesRef = useRef<google.maps.Circle[]>([])

    useEffect(() => {
      if (map && typeof window !== 'undefined' && window.google) {
        // Clear existing circles
        circlesRef.current.forEach(circle => circle.setMap(null))
        circlesRef.current = []

        // Add service location circles
        mappableLocations.forEach(location => {
          if (location.latitude && location.longitude && location.radius && location.radius > 0) {
            const circle = new google.maps.Circle({
              center: { lat: location.latitude, lng: location.longitude },
              radius: location.radius * 1000, // Convert km to meters
              strokeColor: "#DC2626", // Red color for service coverage
              strokeOpacity: 0.8,
              strokeWeight: 2,
              fillColor: "#DC2626",
              fillOpacity: 0.15,
              map,
            })
            circlesRef.current.push(circle)
          }
        })
      }

      return () => {
        circlesRef.current.forEach(circle => circle.setMap(null))
      }
    }, [map, mappableLocations])

    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Header */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Service Location</h4>
        <p className="text-sm text-blue-700">
          {primaryLocation.type === 'physical' 
            ? 'This service is provided at the location shown below.'
            : 'This hybrid service can be provided both remotely and at the location shown below.'
          }
        </p>
        
        {/* Map Legend */}
        <div className="flex items-center mt-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
            <span className="text-blue-700">
              Service location
              {primaryLocation.radius && primaryLocation.radius > 0 && 
                ` (${primaryLocation.radius}km coverage area)`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <APIProvider 
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            onLoad={() => console.log('Service location map loaded')}
            onError={(error) => console.error('Service location map error:', error)}
          >
            <Map
              defaultCenter={center}
              defaultZoom={primaryLocation.radius ? 
                // Adjust zoom based on radius - smaller radius = higher zoom
                Math.max(10, 16 - Math.log2(primaryLocation.radius || 15))
                : 14
              }
              disableDefaultUI={false}
              zoomControl={true}
              streetViewControl={false}
              mapTypeControl={false}
              fullscreenControl={false}
              gestureHandling="cooperative"
              restriction={{
                latLngBounds: {
                  north: -9.0882,    // Northern Australia
                  south: -54.7772,   // Southern Australia  
                  east: 159.1055,    // Eastern Australia
                  west: 112.9211,    // Western Australia
                },
                strictBounds: false,
              }}
            >
              {/* Service Location Markers */}
              {mappableLocations.map((location, index) => (
                <Marker 
                  key={index}
                  position={{ 
                    lat: location.latitude!, 
                    lng: location.longitude! 
                  }}
                  icon={{
                    url: 'data:image/svg+xml;base64,' + btoa(`
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="#DC2626" stroke="#ffffff" stroke-width="2"/>
                        <circle cx="12" cy="12" r="4" fill="#ffffff"/>
                      </svg>
                    `),
                    scaledSize: typeof window !== 'undefined' && window.google 
                      ? new google.maps.Size(24, 24) 
                      : undefined,
                    anchor: typeof window !== 'undefined' && window.google 
                      ? new google.maps.Point(12, 12) 
                      : undefined,
                  }}
                />
              ))}
              
              {/* Service Coverage Circles */}
              <ServiceLocationCircles />
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* Location Details */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium text-gray-900 mb-2">Location Details</h5>
        <div className="space-y-2 text-sm text-gray-600">
          {mappableLocations.map((location, index) => (
            <div key={index}>
              <p>
                <strong>Service Type:</strong>{' '}
                {location.type === 'physical' ? 'In-person only' : 'Hybrid (remote + in-person)'}
              </p>
              {location.area && (
                <p><strong>Area:</strong> {location.area}</p>
              )}
              {location.address && (
                <p><strong>Address:</strong> {location.address}</p>
              )}
              {location.radius && location.radius > 0 && (
                <p><strong>Service Radius:</strong> {location.radius}km from this location</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}