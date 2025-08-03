'use client'

import { useState } from 'react'
import ServiceLocationPicker from '@/components/ServiceLocationPicker'

interface Location {
  lat: number
  lng: number
}

export default function TestLocationPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [selectedRadius, setSelectedRadius] = useState<number>(15)
  const [selectedAddress, setSelectedAddress] = useState<string>('')

  const handleLocationChange = (location: Location, radius: number, address?: string) => {
    setSelectedLocation(location)
    setSelectedRadius(radius)
    setSelectedAddress(address || '')
    console.log('Location changed:', { location, radius, address })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Location Picker Test
          </h1>
          <p className="text-gray-600 mb-8">
            Test the Google Maps location picker component
          </p>

          <ServiceLocationPicker
            initialLocation={{ lat: -33.8688, lng: 151.2093 }} // Sydney
            initialRadius={15}
            onLocationChange={handleLocationChange}
            className="mb-8"
          />

          {/* Display selected values */}
          <div className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Selected Values</h2>
            <div className="space-y-2">
              <div>
                <strong>Location:</strong>{' '}
                {selectedLocation 
                  ? `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`
                  : 'None selected'
                }
              </div>
              <div>
                <strong>Radius:</strong> {selectedRadius}km
              </div>
              <div>
                <strong>Address:</strong> {selectedAddress || 'No address available'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}