'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import ServiceDonationFlow from '@/components/services/ServiceDonationFlow'

export default function TestDonationFlowPage() {
  const [testMode, setTestMode] = useState<'any_charity' | 'specific_charities'>('any_charity')

  // Mock service data for testing
  const mockServiceAnyCharity = {
    id: 'test-service-any',
    title: 'Professional Website Design',
    donation_amount: 150,
    charity_requirement_type: 'any_charity' as const,
    preferred_charities: null,
    provider: {
      id: 'test-provider',
      name: 'John Designer'
    }
  }

  const mockServiceSpecificCharities = {
    id: 'test-service-specific',
    title: 'Business Strategy Consulting',
    donation_amount: 75,
    charity_requirement_type: 'specific_charities' as const,
    preferred_charities: [
      {
        charity_id: '2050',
        name: 'Great Ormond Street Hospital Children\'s Charity',
        description: 'Supporting seriously ill children and their families',
        logo_url: undefined
      },
      {
        charity_id: '183092',
        name: 'Cancer Research UK',
        description: 'Funding research to beat cancer sooner',
        logo_url: undefined
      },
      {
        charity_id: '114015',
        name: 'British Red Cross',
        description: 'Helping people in crisis, whoever and wherever they are',
        logo_url: undefined
      }
    ],
    provider: {
      id: 'test-provider-2',
      name: 'Sarah Consultant'
    }
  }

  const currentService = testMode === 'any_charity' ? mockServiceAnyCharity : mockServiceSpecificCharities

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Donation Flow</h1>
              <p className="text-lg text-gray-600">
                Test the complete donation flow integration with different charity requirement types.
              </p>
            </div>

            {/* Test Mode Selector */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Scenarios</h2>
                
                <div className="flex space-x-4 mb-6">
                  <button
                    onClick={() => setTestMode('any_charity')}
                    className={`px-4 py-2 rounded-md font-medium ${
                      testMode === 'any_charity'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Any Charity Service
                  </button>
                  <button
                    onClick={() => setTestMode('specific_charities')}
                    className={`px-4 py-2 rounded-md font-medium ${
                      testMode === 'specific_charities'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Specific Charities Service
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">
                    Current Test: {testMode === 'any_charity' ? 'Any Charity' : 'Specific Charities'}
                  </h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    {testMode === 'any_charity' ? (
                      <>
                        <p>• User can search and select from all JustGiving charities</p>
                        <p>• Shows popular charity suggestions</p>
                        <p>• Full charity search functionality</p>
                      </>
                    ) : (
                      <>
                        <p>• Provider has pre-selected 3 preferred charities</p>
                        <p>• User chooses from provider's preferred list</p>
                        <p>• Auto-selects if only one charity option</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Mock Service Page Layout */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
                  
                  {/* Left Column - Service Info */}
                  <div className="flex-1">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      {currentService.title}
                    </h1>
                    
                    <div className="flex items-center space-x-2 mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-green-800 bg-green-100">
                        Available Now
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-blue-800 bg-blue-100">
                        {currentService.charity_requirement_type === 'any_charity' ? 'Any Charity' : 'Specific Charities'}
                      </span>
                    </div>

                    <div className="prose prose-lg text-gray-600 mb-8">
                      <p>
                        {testMode === 'any_charity' 
                          ? 'I will create a professional, modern website tailored to your business needs. This includes responsive design, SEO optimization, and content management system setup.'
                          : 'I offer strategic business consulting to help you identify growth opportunities, optimize operations, and develop actionable plans for success.'
                        }
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Service Details</h3>
                        <div className="space-y-2 text-gray-600">
                          <div>Provider: <span className="font-medium">{currentService.provider.name}</span></div>
                          <div>Location: <span className="font-medium">Remote</span></div>
                          <div>Duration: <span className="font-medium">2-3 weeks</span></div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">What's Included</h3>
                        <div className="space-y-2 text-gray-600">
                          {testMode === 'any_charity' ? (
                            <>
                              <div>• Custom website design</div>
                              <div>• Mobile responsiveness</div>
                              <div>• SEO optimization</div>
                            </>
                          ) : (
                            <>
                              <div>• Business analysis</div>
                              <div>• Strategic recommendations</div>
                              <div>• Action plan document</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Donation Flow Component */}
                  <div className="lg:w-96">
                    <ServiceDonationFlow
                      service={currentService}
                      isAvailable={true}
                      isFull={false}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Testing Instructions */}
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-medium text-yellow-900 mb-3">Testing Instructions:</h3>
              <div className="text-sm text-yellow-800 space-y-2">
                <p><strong>1. Authentication:</strong> Login/signup flow is integrated - will redirect to auth if needed</p>
                <p><strong>2. Any Charity:</strong> Click "Support This Service" → Search charities → Select → Redirects to JustGiving</p>
                <p><strong>3. Specific Charities:</strong> Click "Support This Service" → Choose from provider's list → Redirects to JustGiving</p>
                <p><strong>4. JustGiving Integration:</strong> URLs include donation amount and reference for tracking</p>
                <p><strong>5. Error Handling:</strong> Network errors and missing selections are handled gracefully</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}