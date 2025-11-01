'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { FeedbackModal } from './FeedbackModal'
import { CharitySelectionModal } from './CharitySelectionModal'
import { ServiceRequest, DonationPlatform } from '@/types/database'

interface WorkflowActionButtonsProps {
  request: ServiceRequest & {
    services?: {
      title: string
      donation_amount: number
    }
    donor?: {
      display_name?: string
      full_name?: string
    }
    fundraiser?: {
      display_name?: string
      full_name?: string
    }
  }
  userRole: 'donor' | 'fundraiser'
  onStateChange?: (newRequest: ServiceRequest) => void
}

export function WorkflowActionButtons({ 
  request, 
  userRole, 
  onStateChange 
}: WorkflowActionButtonsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [showCharityModal, setShowCharityModal] = useState(false)
  const { toast } = useToast()

  const handleAction = async (action: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/service-requests/${request.id}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Action failed')
      }

      toast({
        title: 'Success',
        description: data.message,
      })

      // Call the state change callback with updated data
      if (onStateChange && data.data) {
        onStateChange(data.data)
      }

    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDonate = () => {
    // Open charity selection modal for donation flow
    setShowCharityModal(true)
  }

  const handleCharitySelect = async (selectedCharity: any) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/service-requests/${request.id}/donate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          charity_id: selectedCharity.justgiving_charity_id
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create donation URL')
      }

      toast({
        title: 'Redirecting to JustGiving',
        description: `You will be redirected to donate £${data.data.amount} to ${selectedCharity.name}`,
      })

      // Redirect to JustGiving donation page
      window.location.href = data.data.donationUrl
      
    } catch (error) {
      console.error('Error creating donation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setShowCharityModal(false)
    }
  }

  const handleFeedbackSubmit = async (feedback: {
    serviceRating?: string
    donorRating?: string
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/service-requests/${request.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Feedback submission failed')
      }

      toast({
        title: 'Success',
        description: data.message,
      })

      // Call the state change callback with updated data
      if (onStateChange && data.data) {
        onStateChange(data.data)
      }

      setShowFeedbackModal(false)

    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Render buttons based on workflow status and user role
  const renderButtons = () => {
    if (!request.workflow_status) return null
    
    switch (request.workflow_status) {
      case 'service_requested':
        if (userRole === 'fundraiser') {
          return (
            <div className="flex gap-2">
              <Button 
                onClick={() => handleAction('accept')}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                Accept Request
              </Button>
              <Button 
                onClick={() => handleAction('decline')}
                disabled={isLoading}
                variant="outline"
              >
                Decline
              </Button>
            </div>
          )
        }
        if (userRole === 'donor') {
          return (
            <Button 
              onClick={() => handleAction('cancel')}
              disabled={isLoading}
              variant="outline"
            >
              Cancel Request
            </Button>
          )
        }
        break

      case 'service_request_accepted':
        if (userRole === 'donor') {
          return (
            <div className="flex gap-2">
              <Button 
                onClick={handleDonate}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Donate £{request.services?.donation_amount}
              </Button>
              <Button 
                onClick={() => handleAction('cancel')}
                disabled={isLoading}
                variant="outline"
              >
                Cancel Request
              </Button>
            </div>
          )
        }
        if (userRole === 'fundraiser') {
          return (
            <div className="text-sm text-gray-600">
              Waiting for donor to complete donation
            </div>
          )
        }
        break

      case 'service_donation_received':
        const needsServiceRating = userRole === 'donor' && !request.donor_service_rating
        const needsDonorRating = userRole === 'fundraiser' && !request.fundraiser_donor_rating

        if (needsServiceRating || needsDonorRating) {
          return (
            <>
              <Button 
                onClick={() => setShowFeedbackModal(true)}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Rate Experience
              </Button>
              {showFeedbackModal && (
                <FeedbackModal
                  isOpen={showFeedbackModal}
                  onClose={() => setShowFeedbackModal(false)}
                  onSubmit={handleFeedbackSubmit}
                  userRole={userRole}
                  isLoading={isLoading}
                />
              )}
            </>
          )
        } else {
          return (
            <div className="text-sm text-green-600">
              Feedback submitted - waiting for other party
            </div>
          )
        }

      case 'service_feedback_recorded':
        return (
          <div className="text-sm text-green-600">
            ✓ Workflow completed successfully
          </div>
        )

      case 'service_request_timeout':
      case 'service_donation_timeout':
      case 'service_feedback_timeout':
        return (
          <div className="text-sm text-gray-500">
            Request expired or cancelled
          </div>
        )

      default:
        return null
    }
  }

  // Mock allowed charities - in production this would come from the service's platform_requirements
  const mockAllowedCharities = [
    {
      justgiving_charity_id: '2116',
      name: 'Cancer Research UK',
      description: 'We fund scientists, doctors and nurses to help beat cancer sooner.',
      logo_url: 'https://images.justgiving.com/image/d3b3c1d1-0c1a-4b1a-9c1a-0c1a4b1a9c1a?template=size100x100'
    },
    {
      justgiving_charity_id: '183092',
      name: 'British Heart Foundation',
      description: 'We fund research to beat heartbreak from heart and circulatory diseases.',
      logo_url: 'https://images.justgiving.com/image/f5c3d2e1-1c2a-4b2a-9c2a-1c2a4b2a9c2a?template=size100x100'
    }
  ]

  return (
    <div className="flex flex-col gap-2">
      {renderButtons()}
      
      {/* Charity Selection Modal for Donation Flow */}
      <CharitySelectionModal
        isOpen={showCharityModal}
        onClose={() => setShowCharityModal(false)}
        onCharitySelect={handleCharitySelect}
        mode="single"
        preSelectedCharities={mockAllowedCharities}
        platform={(request.platform as DonationPlatform) || 'justgiving'}
        title="Select Charity for Donation"
        description={`Choose which charity to support with your £${request.services?.donation_amount || request.donation_amount} donation`}
        isLoading={isLoading}
      />
    </div>
  )
}