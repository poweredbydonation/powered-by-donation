'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Heart, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface DonationSuccessContentProps {
  jgDonationId?: string
  locale: string
}

export default function DonationSuccessContent({ 
  jgDonationId, 
  locale 
}: DonationSuccessContentProps) {
  const [isAnimated, setIsAnimated] = useState(false)

  useEffect(() => {
    // Trigger animation after component mounts
    setTimeout(() => setIsAnimated(true), 100)
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-8 transition-all duration-500 ${
          isAnimated ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'
        }`}>
          {/* Success Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Donation Successful!
            </h1>
            <p className="text-lg text-gray-600">
              Thank you for supporting a great cause
            </p>
          </div>

          {/* Donation Details */}
          {jgDonationId && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-2 text-green-800">
                <Heart className="w-4 h-4" />
                <span className="font-medium">JustGiving Donation ID:</span>
              </div>
              <div className="text-green-700 font-mono text-sm mt-1">
                {jgDonationId}
              </div>
            </div>
          )}

          {/* What Happens Next */}
          <div className="space-y-4 mb-8">
            <h2 className="text-xl font-semibold text-gray-900">What happens next?</h2>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">1</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Donation Receipt</div>
                  <div className="text-gray-600 text-sm">
                    JustGiving will email you a receipt for your charitable donation
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">2</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Provider Connection</div>
                  <div className="text-gray-600 text-sm">
                    The service provider will be notified and will contact you directly to arrange the service
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-sm font-medium">3</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Charity Impact</div>
                  <div className="text-gray-600 text-sm">
                    100% of your donation goes directly to the charity via JustGiving
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={`/${locale}/browse`}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md text-center transition-colors"
            >
              Browse More Services
            </Link>
            <Link
              href={`/${locale}`}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-md text-center transition-colors flex items-center justify-center"
            >
              Back to Home
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This donation was processed securely through JustGiving. 
              If you have any questions about your donation, please contact JustGiving support.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}