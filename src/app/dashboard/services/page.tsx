import { Metadata } from 'next'
import Link from 'next/link'
import AuthGuard from '@/components/auth/AuthGuard'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'My Services | Powered by Donation',
  description: 'Manage your service offerings and track supporter donations',
}

export default function ServicesPage() {
  return (
    <AuthGuard>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Services</h1>
                <p className="mt-2 text-gray-600">
                  Manage your service offerings and track supporter engagement
                </p>
              </div>
              <Link
                href="/dashboard/services/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium"
              >
                Create New Service
              </Link>
            </div>
          </div>

          {/* Placeholder for services list */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-4">
                Create your first service to start connecting with supporters and helping charities.
              </p>
              <Link
                href="/dashboard/services/create"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
              >
                Create Your First Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}