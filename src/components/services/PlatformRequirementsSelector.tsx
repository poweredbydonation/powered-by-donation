/**
 * Platform Requirements Selector Component
 * Provides hierarchical platform → entity-type → organization selection
 */

'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { 
  PlatformRequirements, 
  PlatformRestrictionType, 
  EntityRestrictionType,
  OrganizationRestrictionType,
  DonationPlatform,
  OrganizationCache,
  PlatformRule
} from '@/types/database'
import { ChevronDown, ChevronRight, Check, Search } from 'lucide-react'

interface PlatformRequirementsSelectorProps {
  value: PlatformRequirements | null
  onChange: (requirements: PlatformRequirements) => void
  locale: string
}

interface OrganizationOption {
  id: string
  name: string
  platform: DonationPlatform
  logo_url?: string
}

export default function PlatformRequirementsSelector({
  value,
  onChange,
  locale
}: PlatformRequirementsSelectorProps) {
  const t = useTranslations('service-creation')
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<DonationPlatform, boolean>>({
    justgiving: false,
    everyorg: false
  })
  
  const [organizations, setOrganizations] = useState<Record<DonationPlatform, OrganizationOption[]>>({
    justgiving: [],
    everyorg: []
  })
  
  const [organizationSearch, setOrganizationSearch] = useState<Record<DonationPlatform, string>>({
    justgiving: '',
    everyorg: ''
  })
  
  const [loadingOrganizations, setLoadingOrganizations] = useState<Record<DonationPlatform, boolean>>({
    justgiving: false,
    everyorg: false
  })

  // Initialize default value
  useEffect(() => {
    if (!value) {
      const defaultRequirements: PlatformRequirements = {
        type: 'specific_platforms',
        allowed_platforms: [], // No platform selected by default
        platform_rules: {
          justgiving: {
            entity_types: 'specific_entities',
            allowed_entities: ['charity'],
            organizations: 'specific_organizations',
            specific_organizations: []
          },
          everyorg: {
            entity_types: 'specific_entities',
            allowed_entities: ['nonprofit'],
            organizations: 'specific_organizations',
            specific_organizations: []
          }
        }
      }
      onChange(defaultRequirements)
    }
  }, [value, onChange])

  // Load organizations for a platform when needed
  const loadOrganizations = async (platform: DonationPlatform) => {
    if (organizations[platform].length > 0) return
    
    setLoadingOrganizations(prev => ({ ...prev, [platform]: true }))
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from('organization_cache')
      .select('id, name, platform, logo_url')
      .eq('platform', platform)
      .eq('is_active', true)
      .order('name')
      .limit(100)
    
    if (!error && data) {
      setOrganizations(prev => ({
        ...prev,
        [platform]: data
      }))
    }
    
    setLoadingOrganizations(prev => ({ ...prev, [platform]: false }))
  }

  const handleRestrictionTypeChange = (type: PlatformRestrictionType) => {
    const newRequirements: PlatformRequirements = {
      type,
      allowed_platforms: type === 'any_platform' ? ['justgiving', 'everyorg'] : [],
      platform_rules: value?.platform_rules || {
        justgiving: {
          entity_types: 'any_entities',
          allowed_entities: ['charity'],
          organizations: 'any_organizations',
          specific_organizations: []
        },
        everyorg: {
          entity_types: 'any_entities',
          allowed_entities: ['nonprofit'],
          organizations: 'any_organizations',
          specific_organizations: []
        }
      }
    }
    onChange(newRequirements)
  }

  const handlePlatformToggle = (platform: DonationPlatform) => {
    if (!value) return
    
    const isCurrentlySelected = value.allowed_platforms.includes(platform)
    
    if (isCurrentlySelected) {
      // Deselect platform
      setExpandedPlatforms(prev => ({
        ...prev,
        [platform]: false
      }))
      
      onChange({
        ...value,
        allowed_platforms: value.allowed_platforms.filter(p => p !== platform)
      })
    } else {
      // Select platform and expand it
      setExpandedPlatforms(prev => ({
        ...prev,
        [platform]: true
      }))
      
      // Auto-load organizations for the selected platform
      loadOrganizations(platform)
      
      onChange({
        ...value,
        allowed_platforms: [...value.allowed_platforms, platform]
      })
    }
  }


  const handleOrganizationModeChange = (platform: DonationPlatform, mode: OrganizationRestrictionType) => {
    if (!value) return
    
    const newPlatformRules = {
      ...value.platform_rules,
      [platform]: {
        ...value.platform_rules[platform],
        organizations: mode,
        specific_organizations: mode === 'any_organizations' ? [] : value.platform_rules[platform].specific_organizations
      }
    }
    
    onChange({
      ...value,
      platform_rules: newPlatformRules
    })
    
    // Load organizations if switching to specific mode
    if (mode === 'specific_organizations') {
      loadOrganizations(platform)
    }
  }

  const handleOrganizationToggle = (platform: DonationPlatform, orgId: string) => {
    if (!value) return
    
    const currentOrgs = value.platform_rules[platform].specific_organizations
    const isSelected = currentOrgs.includes(orgId)
    
    const newOrgs = isSelected
      ? currentOrgs.filter(id => id !== orgId)
      : [...currentOrgs, orgId]
    
    const newPlatformRules = {
      ...value.platform_rules,
      [platform]: {
        ...value.platform_rules[platform],
        specific_organizations: newOrgs
      }
    }
    
    onChange({
      ...value,
      platform_rules: newPlatformRules
    })
  }

  const handleSelectAll = (platform: DonationPlatform) => {
    if (!value) return
    
    const allOrgIds = filteredOrganizations(platform).map(org => org.id)
    
    const newPlatformRules = {
      ...value.platform_rules,
      [platform]: {
        ...value.platform_rules[platform],
        specific_organizations: allOrgIds
      }
    }
    
    onChange({
      ...value,
      platform_rules: newPlatformRules
    })
  }

  const handleClearAll = (platform: DonationPlatform) => {
    if (!value) return
    
    const newPlatformRules = {
      ...value.platform_rules,
      [platform]: {
        ...value.platform_rules[platform],
        specific_organizations: []
      }
    }
    
    onChange({
      ...value,
      platform_rules: newPlatformRules
    })
  }

  const handleSelectAllPlatforms = () => {
    if (!value) return
    
    // Select all platforms and expand them
    setExpandedPlatforms({
      justgiving: true,
      everyorg: true
    })
    
    // Load organizations for both platforms
    loadOrganizations('justgiving')
    loadOrganizations('everyorg')
    
    onChange({
      ...value,
      allowed_platforms: ['justgiving', 'everyorg']
    })
  }

  const handleClearAllPlatforms = () => {
    if (!value) return
    
    // Clear all platforms and collapse them
    setExpandedPlatforms({
      justgiving: false,
      everyorg: false
    })
    
    onChange({
      ...value,
      allowed_platforms: []
    })
  }

  const togglePlatformExpansion = (platform: DonationPlatform) => {
    setExpandedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }))
  }

  const filteredOrganizations = (platform: DonationPlatform) => {
    const search = organizationSearch[platform].toLowerCase()
    return organizations[platform].filter(org => 
      org.name.toLowerCase().includes(search)
    )
  }

  if (!value) return null

  const platformConfig = {
    justgiving: { name: 'JustGiving', color: 'blue', entityName: 'Charities' },
    everyorg: { name: 'Every.org', color: 'green', entityName: 'Nonprofits' }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Platform Requirements
        </label>
        
        {/* Platform-Specific Configuration */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Select Platform:</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleSelectAllPlatforms}
                className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-md transition-colors"
              >
                Select All Platforms
              </button>
              {value?.allowed_platforms.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllPlatforms}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          <div className="border rounded-lg p-4 space-y-4">
            {(['justgiving', 'everyorg'] as DonationPlatform[]).map(platform => {
              const config = platformConfig[platform]
              const isSelected = value.allowed_platforms.includes(platform)
              const isExpanded = expandedPlatforms[platform]
              const rule = value.platform_rules[platform]
              
              return (
                <div key={platform} className="border rounded-lg p-3">
                  {/* Platform Header */}
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handlePlatformToggle(platform)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="font-medium text-gray-900">{config.name}</span>
                    <span className="text-sm text-gray-500">({config.entityName})</span>
                  </div>

                  {/* Platform Details */}
                  {isSelected && isExpanded && (
                    <div className="mt-4 ml-6 space-y-4">
                      {/* Organization Selection */}
                      <div>
                        <div className="mt-3 p-3 bg-gray-50 rounded border">
                          {/* Search and Select All */}
                          <div className="flex items-center space-x-2 mb-3">
                            <div className="relative flex-1">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder={`Search ${config.entityName.toLowerCase()}...`}
                                value={organizationSearch[platform]}
                                onChange={(e) => setOrganizationSearch(prev => ({
                                  ...prev,
                                  [platform]: e.target.value
                                }))}
                                className="pl-10 w-full px-3 py-2 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectAll(platform)}
                              className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-md transition-colors"
                            >
                              Select All
                            </button>
                            {rule.specific_organizations.length > 0 && (
                              <button
                                type="button"
                                onClick={() => handleClearAll(platform)}
                                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md transition-colors"
                              >
                                Clear All
                              </button>
                            )}
                          </div>

                          {/* Organization List */}
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {loadingOrganizations[platform] ? (
                              <div className="text-xs text-gray-500 p-2">Loading organizations...</div>
                            ) : filteredOrganizations(platform).length === 0 ? (
                              <div className="text-xs text-gray-500 p-2">No organizations found</div>
                            ) : (
                              filteredOrganizations(platform).map(org => (
                                <label key={org.id} className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={rule.specific_organizations.includes(org.id)}
                                    onChange={() => handleOrganizationToggle(platform, org.id)}
                                    className="h-3 w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <div className="ml-2 flex items-center space-x-2 flex-1 min-w-0">
                                    {org.logo_url && (
                                      <img 
                                        src={org.logo_url} 
                                        alt={org.name}
                                        className="h-4 w-4 rounded object-cover flex-shrink-0"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none'
                                        }}
                                      />
                                    )}
                                    <span className="text-xs text-gray-700 truncate">{org.name}</span>
                                  </div>
                                </label>
                              ))
                            )}
                          </div>

                          {rule.specific_organizations.length > 0 && (
                            <div className="mt-2 text-xs text-gray-600">
                              Selected: {rule.specific_organizations.length} organizations
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}