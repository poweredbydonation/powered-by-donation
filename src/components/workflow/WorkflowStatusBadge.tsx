'use client'

import { Badge } from '@/components/ui/badge'
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowStatusBadgeProps {
  status: string
  className?: string
  showIcon?: boolean
}

export function WorkflowStatusBadge({ 
  status, 
  className, 
  showIcon = true 
}: WorkflowStatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'service_requested':
        return {
          label: 'Pending Response',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock
        }
      
      case 'service_request_accepted':
        return {
          label: 'Awaiting Donation',
          variant: 'secondary' as const,
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock
        }
      
      case 'service_donation_received':
        return {
          label: 'Awaiting Feedback',
          variant: 'secondary' as const,
          className: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: Clock
        }
      
      case 'service_feedback_recorded':
        return {
          label: 'Completed',
          variant: 'secondary' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        }
      
      case 'service_request_timeout':
        return {
          label: 'Request Expired',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        }
      
      case 'service_donation_timeout':
        return {
          label: 'Donation Expired',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        }
      
      case 'service_feedback_timeout':
        return {
          label: 'Auto-Completed',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: AlertTriangle
        }
      
      default:
        return {
          label: 'Unknown Status',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-200',
          icon: AlertTriangle
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge 
      variant={config.variant}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className="w-3 h-3" />}
      <span className="text-xs font-medium">
        {config.label}
      </span>
    </Badge>
  )
}

// Helper function to get readable status text
export function getReadableStatus(status: string): string {
  const config = getStatusConfig(status)
  return config.label
}

// Helper function for status priority (for sorting)
export function getStatusPriority(status: string): number {
  switch (status) {
    case 'service_requested': return 1
    case 'service_request_accepted': return 2
    case 'service_donation_received': return 3
    case 'service_feedback_recorded': return 4
    case 'service_feedback_timeout': return 5
    case 'service_donation_timeout': return 6
    case 'service_request_timeout': return 7
    default: return 999
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'service_requested':
      return { label: 'Pending Response' }
    case 'service_request_accepted':
      return { label: 'Awaiting Donation' }
    case 'service_donation_received':
      return { label: 'Awaiting Feedback' }
    case 'service_feedback_recorded':
      return { label: 'Completed' }
    case 'service_request_timeout':
      return { label: 'Request Expired' }
    case 'service_donation_timeout':
      return { label: 'Donation Expired' }
    case 'service_feedback_timeout':
      return { label: 'Auto-Completed' }
    default:
      return { label: 'Unknown Status' }
  }
}