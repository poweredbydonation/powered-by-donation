'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import CharitySelector from '@/components/services/CharitySelector'
import { Button } from '@/components/ui/button'
import { DonationPlatform } from '@/types/database'

interface SelectedCharity {
  justgiving_charity_id: string
  name: string
  description?: string
  logo_url?: string
}

interface CharitySelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onCharitySelect: (charity: SelectedCharity) => void
  mode: 'single' | 'multiple' // single for donation, multiple for service creation
  preSelectedCharities: SelectedCharity[] // charities already selected by fundraiser
  platform: DonationPlatform
  title?: string
  description?: string
  isLoading?: boolean
}

export function CharitySelectionModal({
  isOpen,
  onClose,
  onCharitySelect,
  mode,
  preSelectedCharities,
  platform,
  title = 'Select Charity',
  description,
  isLoading = false
}: CharitySelectionModalProps) {
  const [selectedCharities, setSelectedCharities] = useState<SelectedCharity[]>([])

  // Initialize with pre-selected charities for single mode (donation flow)
  useEffect(() => {
    if (mode === 'single') {
      setSelectedCharities([]) // Start with none selected in donation mode
    } else {
      setSelectedCharities(preSelectedCharities) // Use existing selection in creation mode
    }
  }, [mode, preSelectedCharities, isOpen])

  const handleCharitiesChange = (charities: SelectedCharity[]) => {
    if (mode === 'single' && charities.length > selectedCharities.length) {
      // In single mode, immediately select the new charity
      const newCharity = charities[charities.length - 1]
      setSelectedCharities([newCharity])
    } else {
      setSelectedCharities(charities)
    }
  }

  const handleConfirm = () => {
    if (selectedCharities.length === 0) return

    if (mode === 'single') {
      // For donation flow, return the single selected charity
      onCharitySelect(selectedCharities[0])
    } else {
      // For service creation, this would handle multiple selection
      // But we're focusing on donation flow for now
      onCharitySelect(selectedCharities[0])
    }
    
    onClose()
  }

  const handleCancel = () => {
    setSelectedCharities(mode === 'single' ? [] : preSelectedCharities)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
            {mode === 'single' && preSelectedCharities.length > 1 && (
              <p className="text-sm text-blue-600 mt-2">
                Choose from {preSelectedCharities.length} fundraiser-approved charities
              </p>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'single' ? (
            // For donation flow - show only pre-selected charities as options
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Select which charity you'd like to support with your donation:
              </div>
              <div className="space-y-3">
                {preSelectedCharities.map((charity) => {
                  const isSelected = selectedCharities.some(
                    c => c.justgiving_charity_id === charity.justgiving_charity_id
                  )
                  return (
                    <div
                      key={charity.justgiving_charity_id}
                      onClick={() => handleCharitiesChange([charity])}
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {isSelected && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      
                      {charity.logo_url && (
                        <img
                          src={charity.logo_url}
                          alt={charity.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      )}
                      
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{charity.name}</h4>
                        {charity.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{charity.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            // For service creation - use the full CharitySelector component
            <CharitySelector
              selectedCharities={selectedCharities}
              onCharitiesChange={handleCharitiesChange}
              maxCharities={5}
              platform={platform}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedCharities.length === 0 || isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </div>
            ) : mode === 'single' ? (
              `Donate to ${selectedCharities[0]?.name || 'Selected Charity'}`
            ) : (
              'Confirm Selection'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}