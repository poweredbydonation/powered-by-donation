'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { Provider, Supporter } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface ProfileEditorProps {
  user: User
  provider: Provider | null
  supporter: Supporter | null
}

export default function ProfileEditor({ user, provider: initialProvider, supporter: initialSupporter }: ProfileEditorProps) {
  const [activeTab, setActiveTab] = useState<'provider' | 'supporter' | 'account'>('account')
  const [provider, setProvider] = useState<Provider | null>(initialProvider)
  const [supporter, setSupporter] = useState<Supporter | null>(initialSupporter)
  const supabase = createClient()

  // Refresh profile data when tab changes
  const refreshProfileData = async () => {
    if (activeTab === 'provider' && provider) {
      const { data: freshProvider } = await supabase
        .from('providers')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (freshProvider) {
        setProvider(freshProvider)
      }
    } else if (activeTab === 'supporter' && supporter) {
      const { data: freshSupporter } = await supabase
        .from('supporters')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (freshSupporter) {
        setSupporter(freshSupporter)
      }
    }
  }

  // Refresh data when switching tabs
  useEffect(() => {
    refreshProfileData()
  }, [activeTab])
  
  // Only show tabs for profiles the user has
  const availableTabs = [
    { id: 'account', label: 'Account Settings', available: true },
    { id: 'provider', label: 'Provider Profile', available: !!provider },
    { id: 'supporter', label: 'Supporter Profile', available: !!supporter },
  ].filter(tab => tab.available)

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'account' && (
        <AccountSettings user={user} />
      )}
      
      {activeTab === 'provider' && provider && (
        <ProviderProfileEditor 
          provider={provider} 
          onUpdate={() => refreshProfileData()}
        />
      )}
      
      {activeTab === 'supporter' && supporter && (
        <SupporterProfileEditor 
          supporter={supporter} 
          onUpdate={() => refreshProfileData()}
        />
      )}
    </div>
  )
}

// Account Settings Component
function AccountSettings({ user }: { user: User }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          To change your email address, please contact support at contact@poweredbydonation.com
        </p>
      </div>
    </div>
  )
}

// Provider Profile Editor Component
function ProviderProfileEditor({ provider, onUpdate }: { provider: Provider; onUpdate: () => void }) {
  const [name, setName] = useState(provider.name || '')
  const [bio, setBio] = useState(provider.bio || '')
  const [showBio, setShowBio] = useState(provider.show_bio ?? true)
  const [showContact, setShowContact] = useState(provider.show_contact ?? false)
  const [showInDirectory, setShowInDirectory] = useState(provider.show_in_directory ?? false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('providers')
        .update({
          name: name.trim(),
          bio: bio.trim() || null,
          show_bio: showBio,
          show_contact: showContact,
          show_in_directory: showInDirectory
        })
        .eq('id', provider.id)

      if (updateError) throw updateError

      setSuccess(true)
      onUpdate() // Refresh parent data
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update provider profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Provider Profile</h2>
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">✓ Provider profile updated successfully!</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="provider-name" className="block text-sm font-medium text-gray-700 mb-2">
              Provider Name *
            </label>
            <input
              id="provider-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="provider-bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio
            </label>
            <textarea
              id="provider-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tell supporters about yourself and your services..."
            />
            <p className="mt-1 text-sm text-gray-500">{bio.length}/500 characters</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="provider-show-bio"
                  type="checkbox"
                  checked={showBio}
                  onChange={(e) => setShowBio(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="provider-show-bio" className="ml-2 block text-sm text-gray-700">
                  Show bio publicly
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="provider-show-contact"
                  type="checkbox"
                  checked={showContact}
                  onChange={(e) => setShowContact(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="provider-show-contact" className="ml-2 block text-sm text-gray-700">
                  Show contact information to supporters
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="provider-show-directory"
                  type="checkbox"
                  checked={showInDirectory}
                  onChange={(e) => setShowInDirectory(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="provider-show-directory" className="ml-2 block text-sm text-gray-700">
                  List me in provider directory
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Provider Profile'}
          </button>
        </div>
      </div>
    </form>
  )
}

// Supporter Profile Editor Component
function SupporterProfileEditor({ supporter, onUpdate }: { supporter: Supporter; onUpdate: () => void }) {
  const [name, setName] = useState(supporter.name || '')
  const [bio, setBio] = useState(supporter.bio || '')
  const [showBio, setShowBio] = useState(supporter.show_bio ?? false)
  const [showDonationHistory, setShowDonationHistory] = useState(supporter.show_donation_history ?? false)
  const [showInDirectory, setShowInDirectory] = useState(supporter.show_in_directory ?? false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('supporters')
        .update({
          name: name.trim() || null,
          bio: bio.trim() || null,
          show_bio: showBio,
          show_donation_history: showDonationHistory,
          show_in_directory: showInDirectory
        })
        .eq('id', supporter.id)

      if (updateError) throw updateError

      setSuccess(true)
      onUpdate() // Refresh parent data
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update supporter profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Supporter Profile</h2>
        
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">✓ Supporter profile updated successfully!</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="supporter-name" className="block text-sm font-medium text-gray-700 mb-2">
              Display Name (Optional)
            </label>
            <input
              id="supporter-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Your name (leave blank to stay anonymous)"
            />
          </div>

          <div>
            <label htmlFor="supporter-bio" className="block text-sm font-medium text-gray-700 mb-2">
              Bio (Optional)
            </label>
            <textarea
              id="supporter-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={300}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Tell others about what causes you care about..."
            />
            <p className="mt-1 text-sm text-gray-500">{bio.length}/300 characters</p>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  id="supporter-show-bio"
                  type="checkbox"
                  checked={showBio}
                  onChange={(e) => setShowBio(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="supporter-show-bio" className="ml-2 block text-sm text-gray-700">
                  Show bio publicly
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="supporter-show-donations"
                  type="checkbox"
                  checked={showDonationHistory}
                  onChange={(e) => setShowDonationHistory(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="supporter-show-donations" className="ml-2 block text-sm text-gray-700">
                  Show my donation history (anonymous amounts only)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  id="supporter-show-directory"
                  type="checkbox"
                  checked={showInDirectory}
                  onChange={(e) => setShowInDirectory(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="supporter-show-directory" className="ml-2 block text-sm text-gray-700">
                  List me in supporter directory
                </label>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Supporter Profile'}
          </button>
        </div>
      </div>
    </form>
  )
}