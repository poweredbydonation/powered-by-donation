import Link from 'next/link'

export default function ContactPage({ params }: { params: { locale: string } }) {
  const { locale } = params

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <Link 
          href={`/${locale}`}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Home
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
        <p className="text-gray-600">Get in touch with the Powered by Donation team</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
              <p className="text-gray-700">
                <a 
                  href="mailto:contact@poweredbydonation.com"
                  className="text-blue-600 hover:text-blue-800"
                >
                  contact@poweredbydonation.com
                </a>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                For general inquiries, support, and partnership opportunities
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Business Details</h3>
              <div className="text-gray-700 space-y-1">
                <p><strong>ABN:</strong> 17 927 784 658</p>
                <p><strong>Location:</strong> New South Wales, Australia</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Platform Links</h3>
              <div className="space-y-2">
                <div>
                  <Link 
                    href={`/${locale}/justgiving/charities`}
                    className="text-blue-600 hover:text-blue-800 block"
                  >
                    Browse JustGiving Charities →
                  </Link>
                </div>
                <div>
                  <Link 
                    href={`/${locale}/everyorg/nonprofits`}
                    className="text-green-600 hover:text-green-800 block"
                  >
                    Browse Every.org Nonprofits →
                  </Link>
                </div>
                <div>
                  <Link 
                    href={`/${locale}/acnc/charities`}
                    className="text-orange-600 hover:text-orange-800 block"
                  >
                    Browse ACNC Organizations →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Contact Form (Placeholder) */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Contact</h2>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="How can we help?"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us more about your inquiry..."
                  disabled
                />
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-800">
                  <strong>Contact form coming soon!</strong><br />
                  For now, please email us directly at{' '}
                  <a 
                    href="mailto:contact@poweredbydonation.com"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    contact@poweredbydonation.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">How does the platform work?</h3>
            <p className="text-gray-700">
              Donors browse services offered by fundraisers, make donations to registered charities 
              (via JustGiving, Every.org, or ACNC), and receive services in return. We facilitate 
              the connection but don't handle payments directly.
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Is my donation tax-deductible?</h3>
            <p className="text-gray-700">
              Donations made through JustGiving, Every.org, and ACNC platforms may be tax-deductible 
              depending on the recipient organization's status. Check each platform's guidelines 
              and consult your tax advisor.
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">How do I report an issue?</h3>
            <p className="text-gray-700">
              Email us at{' '}
              <a 
                href="mailto:contact@poweredbydonation.com"
                className="text-blue-600 hover:text-blue-800"
              >
                contact@poweredbydonation.com
              </a>
              {' '}with details about the issue. We'll respond within 24-48 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}