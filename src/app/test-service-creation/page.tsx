'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import ServiceCreationForm from '@/components/services/ServiceCreationForm'

export default function TestServiceCreationPage() {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Test Service Creation</h1>
              <p className="text-lg text-gray-600">
                Test the updated service creation form with charity selection functionality.
              </p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-900 mb-2">What to Test:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Switch between "Any Charity" and "Specific Charities" options</li>
                  <li>• Search for charities when "Specific Charities" is selected</li>
                  <li>• Select multiple charities (up to 5)</li>
                  <li>• Remove selected charities</li>
                  <li>• Try submitting without selecting charities when required</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-8">
                <ServiceCreationForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}