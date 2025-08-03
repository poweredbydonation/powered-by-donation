'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'

interface Location {
  lat: number
  lng: number
}

interface ServiceLocationPickerProps {
  initialLocation?: Location
  initialRadius?: number
  onLocationChange: (location: Location, radius: number, address?: string) => void
  className?: string
}

export default function ServiceLocationPicker({
  initialLocation = { lat: -33.8688, lng: 151.2093 }, // Sydney default
  initialRadius = 15,
  onLocationChange,
  className = ''
}: ServiceLocationPickerProps) {
  const [center, setCenter] = useState<Location>(initialLocation)
  const [radius, setRadius] = useState(initialRadius)
  const [address, setAddress] = useState('')

  // Handle map click to set new location
  const handleMapClick = useCallback((e: any) => {
    const newCenter = {
      lat: e.detail.latLng.lat,
      lng: e.detail.latLng.lng
    }
    setCenter(newCenter)
    
    // Reverse geocode to get address (optional)
    reverseGeocode(newCenter)
    
    onLocationChange(newCenter, radius, address)
  }, [radius, address, onLocationChange])

  // Handle radius change
  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius)
    onLocationChange(center, newRadius, address)
  }, [center, address, onLocationChange])

  // Reverse geocoding to get human-readable address
  const reverseGeocode = async (location: Location) => {
    try {
      if (typeof window !== 'undefined' && window.google) {
        const geocoder = new google.maps.Geocoder()
        const response = await geocoder.geocode({ location })
        
        if (response.results[0]) {
          const addressComponents = response.results[0].address_components
          const suburb = addressComponents.find(component => 
            component.types.includes('locality') || 
            component.types.includes('sublocality')
          )?.long_name || ''
          
          const state = addressComponents.find(component => 
            component.types.includes('administrative_area_level_1')
          )?.short_name || ''
          
          const formattedAddress = suburb && state ? `${suburb}, ${state}` : response.results[0].formatted_address
          setAddress(formattedAddress)
        }
      }
    } catch (error) {
      console.error('Geocoding failed:', error)
    }
  }

  // Circle component that uses the map instance
  const CircleOverlay = ({ center, radius }: { center: Location, radius: number }) => {
    const map = useMap()
    const circleRef = useRef<google.maps.Circle | null>(null)

    useEffect(() => {
      if (map && typeof window !== 'undefined' && window.google) {
        // Remove existing circle
        if (circleRef.current) {
          circleRef.current.setMap(null)
        }

        // Create new circle
        circleRef.current = new google.maps.Circle({
          center,
          radius: radius * 1000, // Convert km to meters
          strokeColor: "#4F46E5",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#4F46E5",
          fillOpacity: 0.15,
          map,
        })
      }

      return () => {
        if (circleRef.current) {
          circleRef.current.setMap(null)
        }
      }
    }, [map, center, radius])

    return null
  }

  const radiusOptions = [5, 10, 15, 20, 25, 35, 50]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Instructions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-900 mb-2">Set Your Service Location</h3>
        <p className="text-sm text-blue-700">
          Click anywhere on the map to set where you're based. Then adjust the radius to show how far you'll travel for services.
        </p>
      </div>

      {/* Map Container */}
      <div className="relative">
        <div className="h-96 w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm">
          <APIProvider 
            apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
            onLoad={() => console.log('Google Maps loaded')}
            onError={(error) => console.error('Google Maps error:', error)}
          >
            <Map
              defaultCenter={center}
              defaultZoom={12}
              onClick={handleMapClick}
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
              {/* Location Marker */}
              <Marker 
                position={center}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="6" fill="#4F46E5" stroke="#ffffff" stroke-width="2"/>
                      <circle cx="8" cy="8" r="2" fill="#ffffff"/>
                    </svg>
                  `),
                  scaledSize: typeof window !== 'undefined' && window.google 
                    ? new google.maps.Size(16, 16) 
                    : undefined,
                  anchor: typeof window !== 'undefined' && window.google 
                    ? new google.maps.Point(8, 8) 
                    : undefined,
                }}
              />
              
              {/* Service Radius Circle */}
              <CircleOverlay center={center} radius={radius} />
            </Map>
          </APIProvider>
        </div>

        {/* Map overlay with current coordinates (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
            {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
          </div>
        )}
      </div>

      {/* Radius Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Service radius: <span className="font-semibold text-blue-600">{radius}km</span>
        </label>
        
        {/* Desktop: Slider */}
        <div className="hidden sm:block">
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={radius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5km</span>
            <span>25km</span>
            <span>50km</span>
          </div>
        </div>

        {/* Mobile: Button Grid */}
        <div className="grid grid-cols-4 gap-2 sm:hidden">
          {radiusOptions.map(r => (
            <button
              key={r}
              onClick={() => handleRadiusChange(r)}
              className={`p-2 rounded-md text-sm font-medium transition-colors ${
                radius === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>

        <p className="text-sm text-gray-600">
          You'll provide services within <strong>{radius}km</strong> of your marked location
          {address && (
            <span className="block mt-1 text-gray-500">
              Located in: <strong>{address}</strong>
            </span>
          )}
        </p>
      </div>

      {/* Location Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Location Summary</h4>
        <div className="space-y-1 text-sm text-gray-600">
          <p><strong>Service Center:</strong> {address || 'Click map to set location'}</p>
          <p><strong>Coverage Radius:</strong> {radius}km</p>
          <p><strong>Approximate Coverage:</strong> {Math.round(Math.PI * radius * radius)} km² area</p>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #4F46E5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #4F46E5;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  )
}