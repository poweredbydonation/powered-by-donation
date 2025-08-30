import Link from 'next/link'

export default function PrivacyPage({ params }: { params: { locale: string } }) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600">Last updated: August 30, 2025</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
            <p className="text-gray-700 leading-relaxed">
              Powered by Donation is committed to protecting your privacy. This policy explains how we collect, 
              use, and safeguard your personal information when you use our donation-service marketplace.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Account information (email, profile details)</li>
              <li>• Service listings and descriptions</li>
              <li>• Donation activity and preferences</li>
              <li>• Usage analytics and platform interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <ul className="text-gray-700 space-y-2">
              <li>• Facilitate connections between donors and fundraisers</li>
              <li>• Process service requests and donation flows</li>
              <li>• Improve platform functionality and user experience</li>
              <li>• Comply with legal and regulatory requirements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              We maintain anonymous public displays and provide optional personal recognition. 
              Your personal information is never shared publicly without your explicit consent.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Third-Party Platforms</h2>
            <p className="text-gray-700 leading-relaxed">
              We integrate with JustGiving, Every.org, and ACNC platforms. When you donate through these platforms, 
              their respective privacy policies apply to the donation process.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              For privacy-related inquiries, contact us at{' '}
              <a href="mailto:contact@poweredbydonation.com" className="text-blue-600 hover:text-blue-800">
                contact@poweredbydonation.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Australian Privacy Compliance</h2>
            <p className="text-gray-700 leading-relaxed">
              As an Australian business (ABN: 17 927 784 658), we comply with the Privacy Act 1988 and 
              Australian Privacy Principles (APPs).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}