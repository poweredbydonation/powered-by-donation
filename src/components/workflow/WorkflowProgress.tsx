'use client'

import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowProgressProps {
  status: string
  className?: string
}

export function WorkflowProgress({ status, className }: WorkflowProgressProps) {
  const getStepDescription = (stepId: string, stepStatus: string) => {
    if (stepStatus === 'completed') {
      // Show completion descriptions for finished steps
      switch (stepId) {
        case 'service_requested':
          return 'Request was sent'
        case 'service_request_accepted':
          return 'Request was accepted'
        case 'service_donation_received':
          return 'Donation completed'
        case 'service_feedback_recorded':
          return 'Workflow finished'
        default:
          return 'Completed'
      }
    }
    
    // Show active/pending descriptions
    switch (stepId) {
      case 'service_requested':
        return 'Waiting for fundraiser response'
      case 'service_request_accepted':
        return 'Ready for donation'
      case 'service_donation_received':
        return 'Service can begin'
      case 'service_feedback_recorded':
        return 'Workflow finished'
      default:
        return 'Pending'
    }
  }

  const steps = [
    {
      id: 'service_requested',
      title: 'Request Sent'
    },
    {
      id: 'service_request_accepted',
      title: 'Request Accepted'
    },
    {
      id: 'service_donation_received',
      title: 'Donation Received'
    },
    {
      id: 'service_feedback_recorded',
      title: 'Feedback Completed'
    }
  ]

  const timeoutStates = [
    'service_request_timeout',
    'service_donation_timeout', 
    'service_feedback_timeout'
  ]

  const isTimeout = timeoutStates.includes(status)
  const isCompleted = status === 'service_feedback_recorded'

  const getStepStatus = (stepId: string, index: number) => {
    if (isTimeout) {
      // For timeout states, show where it failed
      if (status === 'service_request_timeout' && index === 0) return 'failed'
      if (status === 'service_donation_timeout' && index <= 1) return index === 1 ? 'failed' : 'completed'
      if (status === 'service_feedback_timeout' && index <= 2) return index === 2 ? 'failed' : 'completed'
      return index < getCurrentStepIndex() ? 'completed' : 'pending'
    }

    if (stepId === status) return 'current'
    if (getCurrentStepIndex() > index) return 'completed'
    return 'pending'
  }

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === status)
  }

  const getStepIcon = (stepStatus: string) => {
    switch (stepStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'current':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  // Special handling for timeout/error states
  if (isTimeout) {
    return (
      <div className={cn("bg-red-50 border border-red-200 rounded-lg p-4", className)}>
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium">
            {status === 'service_request_timeout' && 'Request Expired'}
            {status === 'service_donation_timeout' && 'Donation Period Expired'} 
            {status === 'service_feedback_timeout' && 'Feedback Auto-Completed'}
          </span>
        </div>
        <p className="text-sm text-red-600 mt-1">
          {status === 'service_request_timeout' && 'The fundraiser did not respond within 3 days'}
          {status === 'service_donation_timeout' && 'Donation was not completed within 3 days'}
          {status === 'service_feedback_timeout' && 'Feedback period expired - ratings defaulted to "Great"'}
        </p>
      </div>
    )
  }

  return (
    <div className={cn("bg-gray-50 rounded-lg p-3 md:p-4", className)}>
      {/* Desktop/Tablet View - Horizontal Layout */}
      <div className="hidden sm:flex items-center justify-between">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id, index)
          const isLastStep = index === steps.length - 1

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center">
                  {getStepIcon(stepStatus)}
                </div>
                <div className="text-center mt-2 min-h-[60px] flex flex-col justify-start">
                  <div className={cn(
                    "text-sm font-medium leading-tight",
                    stepStatus === 'completed' && "text-green-800",
                    stepStatus === 'current' && "text-blue-800",
                    stepStatus === 'failed' && "text-red-800",
                    stepStatus === 'pending' && "text-gray-600"
                  )}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight max-w-28 mx-auto">
                    {getStepDescription(step.id, stepStatus)}
                  </div>
                </div>
              </div>
              
              {!isLastStep && (
                <div className={cn(
                  "flex-1 h-0.5 mx-4",
                  getCurrentStepIndex() > index ? "bg-green-300" : "bg-gray-300"
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Mobile View - Vertical Layout */}
      <div className="sm:hidden space-y-3">
        {steps.map((step, index) => {
          const stepStatus = getStepStatus(step.id, index)
          const isLastStep = index === steps.length - 1

          return (
            <div key={step.id}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center flex-shrink-0">
                  {getStepIcon(stepStatus)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-sm font-medium leading-tight",
                    stepStatus === 'completed' && "text-green-800",
                    stepStatus === 'current' && "text-blue-800",
                    stepStatus === 'failed' && "text-red-800",
                    stepStatus === 'pending' && "text-gray-600"
                  )}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 leading-tight">
                    {getStepDescription(step.id, stepStatus)}
                  </div>
                </div>
              </div>
              
              {!isLastStep && (
                <div className="flex justify-start ml-2 mt-2 mb-1">
                  <div className={cn(
                    "w-0.5 h-6",
                    getCurrentStepIndex() > index ? "bg-green-300" : "bg-gray-300"
                  )} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isCompleted && (
        <div className="mt-4 text-center">
          <div className="text-green-800 text-sm font-medium">
            ✨ Workflow completed successfully!
          </div>
        </div>
      )}
    </div>
  )
}