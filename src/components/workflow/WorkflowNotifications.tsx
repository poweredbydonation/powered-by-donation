'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'

interface ServiceRequest {
  id: string
  donor_id: string
  fundraiser_id: string
  workflow_status: string
  services?: {
    title: string
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

interface WorkflowNotificationsProps {
  userId: string
}

export function WorkflowNotifications({ userId }: WorkflowNotificationsProps) {
  const [notifications, setNotifications] = useState<ServiceRequest[]>([])
  const [isVisible, setIsVisible] = useState(false)
  // Simple toast replacement for now
  const toast = (message: any) => {
    console.log('Notification:', message)
  }
  const supabase = createClient()

  useEffect(() => {
    // Subscribe to real-time changes in service_requests
    const channel = supabase
      .channel('workflow-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `donor_id=eq.${userId},fundraiser_id=eq.${userId}`,
        },
        (payload) => {
          handleRealtimeUpdate(payload)
        }
      )
      .subscribe()

    // Load initial notifications for requests requiring action
    loadActionRequiredNotifications()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const loadActionRequiredNotifications = async () => {
    try {
      // For now, just return empty array to avoid type errors
      // This will need to be properly implemented with the correct API endpoints
      setNotifications([])
      setIsVisible(false)
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  const handleRealtimeUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    // Show toast notification for status changes
    if (eventType === 'UPDATE' && oldRecord?.workflow_status !== newRecord?.workflow_status) {
      const message = getStatusChangeMessage(
        newRecord.workflow_status, 
        newRecord.donor_id === userId
      )
      
      if (message) {
        toast({
          title: 'Request Update',
          description: message,
          duration: 5000,
        })
      }
    }

    // Reload notifications to reflect changes
    loadActionRequiredNotifications()
  }

  const getStatusChangeMessage = (status: string, isUserDonor: boolean): string | null => {
    switch (status) {
      case 'service_request_accepted':
        return isUserDonor 
          ? 'Your service request was accepted! Ready to donate.' 
          : 'You accepted a service request.'
      
      case 'service_donation_received':
        return isUserDonor
          ? 'Your donation was confirmed! Service can begin.'
          : 'Donation received - service can begin!'
      
      case 'service_feedback_recorded':
        return 'Feedback completed - workflow finished!'
      
      case 'service_request_timeout':
        return 'Service request expired due to no response.'
      
      case 'service_donation_timeout':
        return 'Service request expired - donation not completed in time.'
      
      default:
        return null
    }
  }

  const getActionText = (request: ServiceRequest): string => {
    const isDonor = request.donor_id === userId
    
    switch (request.workflow_status) {
      case 'service_requested':
        return 'Please accept or decline this request'
      
      case 'service_request_accepted':
        return 'Please complete your donation'
      
      case 'service_donation_received':
        return isDonor 
          ? 'Please rate your service experience'
          : 'Please rate the donor experience'
      
      default:
        return 'Action required'
    }
  }

  const dismissNotification = (requestId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== requestId))
    if (notifications.length <= 1) {
      setIsVisible(false)
    }
  }

  if (!isVisible || notifications.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm z-50">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">
              Action Required ({notifications.length})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-3">
          {notifications.slice(0, 3).map(request => (
            <div
              key={request.id}
              className="border border-gray-100 rounded p-3 text-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">
                  {request.services?.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissNotification(request.id)}
                  className="h-5 w-5 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
              
              <WorkflowStatusBadge 
                status={request.workflow_status} 
                className="mb-2"
              />
              
              <p className="text-gray-600 text-xs">
                {getActionText(request)}
              </p>
            </div>
          ))}

          {notifications.length > 3 && (
            <div className="text-xs text-gray-500 text-center">
              +{notifications.length - 3} more notifications
            </div>
          )}
        </div>
      </div>
    </div>
  )
}