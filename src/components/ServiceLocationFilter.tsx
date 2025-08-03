'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps'
import { MapPin, Globe, Monitor, Navigation } from 'lucide-react'
import { ServiceLocation } from '@/types/database'

interface Location {
  lat: number
  lng: number
}

interface LocationFilter {
  type: 'all' | 'remote' | 'physical' | 'hybrid'
  location?: Location
  radius?: number
}

interface ServiceWithLocation {
  id: string
  title: string
  service_locations: ServiceLocation[]
}

interface ServiceLocationFilterProps {
  onFilterChange: (filter: LocationFilter) => void
  services?: ServiceWithLocation[]
  className?: string
}

export default function ServiceLocationFilter({
  onFilterChange,
  services = [],
  className = ''
}: ServiceLocationFilterProps) {
  const [selectedType, setSelectedType] = useState<'all' | 'remote' | 'physical' | 'hybrid'>('all')
  const [center, setCenter] = useState<Location>({ lat: -33.8688, lng: 151.2093 }) // Sydney default
  const [radius, setRadius] = useState(15)
  const [address, setAddress] = useState('')
  const [showMap, setShowMap] = useState(false)

  // Handle location type change
  const handleTypeChange = useCallback((type: 'all' | 'remote' | 'physical' | 'hybrid') => {
    setSelectedType(type)
    setShowMap(type === 'physical' || type === 'hybrid')
    
    // Emit filter change
    if (type === 'all' || type === 'remote') {
      onFilterChange({ type })
    } else {
      onFilterChange({ 
        type, 
        location: center,
        radius 
      })
    }
  }, [center, radius, onFilterChange])

  // Handle map click to set new location
  const handleMapClick = useCallback((e: any) => {
    const newCenter = {
      lat: e.detail.latLng.lat,
      lng: e.detail.latLng.lng
    }
    setCenter(newCenter)
    
    // Reverse geocode to get address
    reverseGeocode(newCenter)
    
    // Emit filter change if physical/hybrid is selected
    if (selectedType === 'physical' || selectedType === 'hybrid') {
      onFilterChange({
        type: selectedType,
        location: newCenter,
        radius
      })
    }
  }, [selectedType, radius, onFilterChange])

  // Handle radius change
  const handleRadiusChange = useCallback((newRadius: number) => {
    setRadius(newRadius)
    
    // Emit filter change if physical/hybrid is selected
    if (selectedType === 'physical' || selectedType === 'hybrid') {
      onFilterChange({
        type: selectedType,
        location: center,
        radius: newRadius
      })
    }
  }, [selectedType, center, onFilterChange])

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

  // User search circle component
  const UserSearchCircle = ({ center, radius }: { center: Location, radius: number }) => {
    const map = useMap()
    const circleRef = useRef<google.maps.Circle | null>(null)

    useEffect(() => {
      if (map && typeof window !== 'undefined' && window.google) {
        // Remove existing circle
        if (circleRef.current) {
          circleRef.current.setMap(null)
        }

        // Create new circle for user search area
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

  // Service location circles component
  const ServiceLocationCircles = () => {
    const map = useMap()
    const circlesRef = useRef<google.maps.Circle[]>([])
    const markersRef = useRef<google.maps.Marker[]>([])

    useEffect(() => {
      if (map && typeof window !== 'undefined' && window.google) {
        // Clear existing circles and markers
        circlesRef.current.forEach(circle => circle.setMap(null))
        markersRef.current.forEach(marker => marker.setMap(null))
        circlesRef.current = []
        markersRef.current = []

        // Add service location circles
        services.forEach(service => {
          if (Array.isArray(service.service_locations)) {
            service.service_locations.forEach(location => {
              if (location.latitude && location.longitude && location.type !== 'remote') {
                // Create service marker
                const marker = new google.maps.Marker({
                  position: { lat: location.latitude, lng: location.longitude },
                  map,
                  title: service.title,
                  icon: {
                    url: 'data:image/svg+xml;base64,' + btoa(`
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="10" cy="10" r="8" fill="#DC2626" stroke="#ffffff" stroke-width="2"/>
                        <circle cx="10" cy="10" r="3" fill="#ffffff"/>
                      </svg>
                    `),
                    scaledSize: new google.maps.Size(20, 20),
                    anchor: new google.maps.Point(10, 10),
                  }
                })
                markersRef.current.push(marker)

                // Create service coverage circle if radius exists
                if (location.radius && location.radius > 0) {
                  const circle = new google.maps.Circle({
                    center: { lat: location.latitude, lng: location.longitude },
                    radius: location.radius * 1000, // Convert km to meters
                    strokeColor: "#DC2626", // Red color for services
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                    fillColor: "#DC2626",
                    fillOpacity: 0.15,
                    map,
                  })
                  circlesRef.current.push(circle)
                }
              }
            })
          }
        })
      }

      return () => {
        circlesRef.current.forEach(circle => circle.setMap(null))
        markersRef.current.forEach(marker => marker.setMap(null))
      }
    }, [map, services, selectedType])

    return null
  }

  const radiusOptions = [5, 10, 15, 20, 25, 35, 50]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Location Type Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Service Location</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleTypeChange('all')}
            className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
              selectedType === 'all'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Globe className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">All Services</span>
          </button>
          
          <button
            onClick={() => handleTypeChange('remote')}
            className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
              selectedType === 'remote'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Monitor className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Remote</span>
          </button>
          
          <button
            onClick={() => handleTypeChange('physical')}
            className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
              selectedType === 'physical'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapPin className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">In-Person</span>
          </button>
          
          <button
            onClick={() => handleTypeChange('hybrid')}
            className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
              selectedType === 'hybrid'
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Navigation className="h-4 w-4 mr-2" />
            <span className="text-sm font-medium">Hybrid</span>
          </button>
        </div>

        {/* Location type descriptions */}
        <div className="text-sm text-gray-600">
          {selectedType === 'all' && "Show all available services"}
          {selectedType === 'remote' && "Online delivery via video calls, email, etc."}
          {selectedType === 'physical' && "In-person service at a specific location"}
          {selectedType === 'hybrid' && "Both remote and in-person options available"}
        </div>
      </div>

      {/* Map Section for Physical/Hybrid */}
      {showMap && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">Find Services Near You</h4>
            <p className="text-sm text-blue-700 mb-3">
              Click on the map to set your location and adjust the radius to find nearby services.
            </p>
            
            {/* Map Legend */}
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-blue-700">Your search area</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-600 mr-2"></div>
                <span className="text-blue-700">Service locations & coverage</span>
              </div>
            </div>
          </div>

          {/* Map Container */}
          <div className="relative">
            <div className="h-80 w-full rounded-lg overflow-hidden border border-gray-300 shadow-sm">
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
                  />
                  
                  {/* User Search Area Circle */}
                  <UserSearchCircle center={center} radius={radius} />
                  
                  {/* Service Location Circles */}
                  <ServiceLocationCircles />
                </Map>
              </APIProvider>
            </div>
          </div>

          {/* Radius Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Search radius: <span className="font-semibold text-blue-600">{radius}km</span>
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

            <div className="text-sm text-gray-600">
              Showing services within <strong>{radius}km</strong> of your selected location
              {address && (
                <span className="block mt-1 text-gray-500">
                  <MapPin className="h-3 w-3 inline mr-1" />
                  <strong>{address}</strong>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

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