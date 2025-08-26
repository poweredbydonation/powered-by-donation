'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ServiceRequest, ServiceWorkflowStatus } from '@/types/database'
import { WorkflowStatusBadge, WorkflowProgress, WorkflowActionButtons } from '@/components/workflow'
import { Button } from '@/components/ui/button'
import { RefreshCw, Filter, Clock, CheckCircle, CreditCard, MessageSquare, AlertTriangle } from 'lucide-react'
import ServiceCard from '@/components/services/ServiceCard'

interface WorkflowDashboardProps {
  userId: string
  userRole?: 'donor' | 'fundraiser' | 'both'
}

interface ServiceRequestWithDetails extends ServiceRequest {
  services?: {
    id: string
    title: string
    description?: string
    donation_amount: number
    fundraiser_id: string
  }
  donor?: {
    id: string
    full_name?: string
    display_name?: string
  }
  fundraiser?: {
    id: string
    full_name?: string
    display_name?: string
  }
}

export function WorkflowDashboard({ userId, userRole = 'both' }: WorkflowDashboardProps) {
  const [requests, setRequests] = useState<ServiceRequestWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<ServiceWorkflowStatus | 'all' | 'timeout'>('all')
  const [roleFilter, setRoleFilter] = useState<'donor' | 'fundraiser' | 'all'>('all')
  const supabase = createClient()

  const statusCounts = {
    all: requests.length,
    service_requested: requests.filter(r => r.workflow_status === 'service_requested').length,
    service_request_accepted: requests.filter(r => r.workflow_status === 'service_request_accepted').length,
    service_donation_received: requests.filter(r => r.workflow_status === 'service_donation_received').length,
    service_feedback_recorded: requests.filter(r => r.workflow_status === 'service_feedback_recorded').length,
    timeouts: requests.filter(r => r.workflow_status?.includes('timeout')).length,
  }

  const roleCounts = {
    all: requests.length,
    donor: requests.filter(r => r.donor_id === userId).length,
    fundraiser: requests.filter(r => r.fundraiser_id === userId).length,
  }

  const loadRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/service-requests/user/${userId}?role=${roleFilter}`)
      const data = await response.json()

      if (data.success) {
        setRequests(data.data)
      } else {
        console.error('Failed to load requests:', data.error)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [userId, roleFilter])

  const handleWorkflowUpdate = (updatedRequest: ServiceRequest) => {
    setRequests(prev => 
      prev.map(req => req.id === updatedRequest.id ? { ...req, ...updatedRequest } : req)
    )
  }

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true
    if (filter === 'timeout') {
      return request.workflow_status?.includes('timeout')
    }
    return request.workflow_status === filter
  })

  const getRequestTitle = (request: ServiceRequestWithDetails) => {
    return request.services?.title || 'Unknown Service'
  }

  const getOtherPartyName = (request: ServiceRequestWithDetails) => {
    const isDonor = request.donor_id === userId
    const otherParty = isDonor ? request.fundraiser : request.donor
    return otherParty?.display_name || otherParty?.full_name || 'Unknown User'
  }

  const getUserRoleForRequest = (request: ServiceRequestWithDetails): 'donor' | 'fundraiser' => {
    return request.donor_id === userId ? 'donor' : 'fundraiser'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading workflow requests...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Service Workflow</h2>
        <Button onClick={loadRequests} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Role Filter */}
      {userRole === 'both' && (
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex gap-2">
            <button 
              onClick={() => setRoleFilter('donor')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md ${
                roleFilter === 'donor' 
                  ? 'bg-green-600 text-white ring-2 ring-green-500' 
                  : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
              }`}
            >
              Requested Services ({roleCounts.donor})
            </button>
            <button 
              onClick={() => setRoleFilter('fundraiser')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md ${
                roleFilter === 'fundraiser' 
                  ? 'bg-orange-600 text-white ring-2 ring-orange-500' 
                  : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
              }`}
            >
              Accepted Services ({roleCounts.fundraiser})
            </button>
            <button 
              onClick={() => setFilter('timeout')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all hover:shadow-md ${
                filter === 'timeout' 
                  ? 'bg-red-600 text-white ring-2 ring-red-500' 
                  : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              }`}
            >
              Expired Services ({statusCounts.timeouts})
            </button>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button 
          onClick={() => setFilter('service_requested')}
          className={`bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-left transition-all hover:shadow-md ${
            filter === 'service_requested' ? 'ring-2 ring-blue-500 border-blue-300' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-800">{statusCounts.service_requested}</div>
          </div>
          <div className="text-sm text-yellow-600">Request Sent</div>
        </button>
        <button 
          onClick={() => setFilter('service_request_accepted')}
          className={`bg-blue-50 p-4 rounded-lg border border-blue-200 text-left transition-all hover:shadow-md ${
            filter === 'service_request_accepted' ? 'ring-2 ring-blue-500 border-blue-300' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <div className="text-2xl font-bold text-blue-800">{statusCounts.service_request_accepted}</div>
          </div>
          <div className="text-sm text-blue-600">Request Accepted</div>
        </button>
        <button 
          onClick={() => setFilter('service_donation_received')}
          className={`bg-purple-50 p-4 rounded-lg border border-purple-200 text-left transition-all hover:shadow-md ${
            filter === 'service_donation_received' ? 'ring-2 ring-blue-500 border-blue-300' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <div className="text-2xl font-bold text-purple-800">{statusCounts.service_donation_received}</div>
          </div>
          <div className="text-sm text-purple-600">Donation Received</div>
        </button>
        <button 
          onClick={() => setFilter('service_feedback_recorded')}
          className={`bg-green-50 p-4 rounded-lg border border-green-200 text-left transition-all hover:shadow-md ${
            filter === 'service_feedback_recorded' ? 'ring-2 ring-blue-500 border-blue-300' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <div className="text-2xl font-bold text-green-800">{statusCounts.service_feedback_recorded}</div>
          </div>
          <div className="text-sm text-green-600">Feedback Completed</div>
        </button>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-500 mb-2">No workflow requests found</div>
          <div className="text-sm text-gray-400">
            {filter === 'all' ? 'No requests yet' : `No requests with status "${filter}"`}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRequests.map((request) => {
            const userRoleForRequest = getUserRoleForRequest(request)
            
            return (
              <div key={request.id} className="bg-white border border-gray-200 rounded-lg p-6">
                {/* Request Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getRequestTitle(request)}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {userRoleForRequest === 'donor' ? 'Requested from' : 'Requested by'}{' '}
                      <span className="font-medium">{getOtherPartyName(request)}</span>
                      <span className="mx-2">•</span>
                      <span>£{request.donation_amount}</span>
                    </div>
                  </div>
                  <WorkflowStatusBadge status={request.workflow_status || 'service_requested'} />
                </div>

                {/* Workflow Progress */}
                <div className="mb-6">
                  <WorkflowProgress status={request.workflow_status || 'service_requested'} />
                </div>

                {/* Action Buttons */}
                <WorkflowActionButtons
                  request={request}
                  userRole={userRoleForRequest}
                  onStateChange={handleWorkflowUpdate}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}