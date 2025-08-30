import Link from 'next/link'

export default function TermsPage({ params }: { params: { locale: string } }) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-600">Last updated: August 30, 2025</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              Powered by Donation is a marketplace connecting donors with fundraisers who offer services 
              in exchange for charitable donations. We facilitate connections but do not handle payments directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Offerings</h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Fundraisers offer skills and services in exchange for charitable donations</li>
              <li>• All services have fixed donation amounts (no variable pricing)</li>
              <li>• Donations are made directly to JustGiving, Every.org, or ACNC registered charities</li>
              <li>• Service delivery is coordinated between donors and fundraisers</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Responsibilities</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For Donors:</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Make genuine donations to legitimate charities</li>
                  <li>• Provide accurate donation confirmation details</li>
                  <li>• Communicate respectfully with fundraisers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">For Fundraisers:</h3>
                <ul className="text-gray-700 space-y-1">
                  <li>• Deliver services as described and promised</li>
                  <li>• Maintain professional standards in all interactions</li>
                  <li>• Honor fixed pricing and donation requirements</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Policies</h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Anonymous public displays protect user privacy</li>
              <li>• Fixed pricing ensures predictable donation amounts</li>
              <li>• Multi-platform integration (JustGiving, Every.org, ACNC)</li>
              <li>• Australian Consumer Law and ACNC compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment and Donations</h2>
            <p className="text-gray-700 leading-relaxed">
              All donations are processed directly through third-party platforms (JustGiving, Every.org, ACNC). 
              Powered by Donation does not handle monetary transactions. Each platform's terms apply to donations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              Powered by Donation facilitates connections between users but is not responsible for service delivery, 
              donation disputes, or interactions between donors and fundraisers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Australian Legal Framework</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms are governed by Australian law. As a registered Australian business 
              (ABN: 17 927 784 658), we comply with Consumer Law and ACNC requirements.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              For questions about these terms, contact:{' '}
              <a href="mailto:contact@poweredbydonation.com" className="text-blue-600 hover:text-blue-800">
                contact@poweredbydonation.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}