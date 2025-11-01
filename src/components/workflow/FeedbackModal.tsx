'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (feedback: { serviceRating?: string; donorRating?: string }) => void
  userRole: 'donor' | 'fundraiser'
  isLoading: boolean
}

export function FeedbackModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  userRole, 
  isLoading 
}: FeedbackModalProps) {
  const [serviceRating, setServiceRating] = useState('')
  const [donorRating, setDonorRating] = useState('')

  // Debug logging
  console.log('FeedbackModal state:', { 
    userRole, 
    serviceRating, 
    donorRating, 
    isLoading,
    buttonDisabled: isLoading || (userRole === 'donor' ? !serviceRating : !donorRating)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const feedback: { serviceRating?: string; donorRating?: string } = {}
    
    if (userRole === 'donor') {
      feedback.serviceRating = serviceRating
    } else {
      feedback.donorRating = donorRating
    }
    
    onSubmit(feedback)
  }

  const resetForm = () => {
    setServiceRating('')
    setDonorRating('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>
        
        <div className="mb-6">
          <h2 className="text-lg font-semibold">
            How was your experience?
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {userRole === 'donor' && (
            <div className="space-y-4">
              <div className="text-base font-medium">
                How would you rate this service?
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="service-great"
                    name="serviceRating"
                    value="Great"
                    checked={serviceRating === "Great"}
                    onChange={(e) => setServiceRating(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="service-great" className="cursor-pointer">
                    Great
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="service-better"
                    name="serviceRating"
                    value="Could be better"
                    checked={serviceRating === "Could be better"}
                    onChange={(e) => setServiceRating(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="service-better" className="cursor-pointer">
                    Could be better
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="service-not-delivered"
                    name="serviceRating"
                    value="Service not delivered"
                    checked={serviceRating === "Service not delivered"}
                    onChange={(e) => setServiceRating(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="service-not-delivered" className="cursor-pointer">
                    Service not delivered
                  </label>
                </div>
              </div>
            </div>
          )}

          {userRole === 'fundraiser' && (
            <div className="space-y-4">
              <div className="text-base font-medium">
                How would you rate this donor?
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="donor-great"
                    name="donorRating"
                    value="Great"
                    checked={donorRating === "Great"}
                    onChange={(e) => setDonorRating(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="donor-great" className="cursor-pointer">
                    Great
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="donor-better"
                    name="donorRating"
                    value="Could be better"
                    checked={donorRating === "Could be better"}
                    onChange={(e) => setDonorRating(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="donor-better" className="cursor-pointer">
                    Could be better
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="donor-no-response"
                    name="donorRating"
                    value="No response"
                    checked={donorRating === "No response"}
                    onChange={(e) => setDonorRating(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <label htmlFor="donor-no-response" className="cursor-pointer">
                    No response
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading || (userRole === 'donor' ? !serviceRating : !donorRating)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}