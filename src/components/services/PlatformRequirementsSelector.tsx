/**
 * Platform Requirements Selector Component
 * Provides hierarchical platform → entity-type → organization selection
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
import { ChevronDown, ChevronRight, Check, Search, X } from 'lucide-react'

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

interface PaginationState {
  page: number
  totalCount: number
  hasMore: boolean
}

export default function PlatformRequirementsSelector({
  value,
  onChange,
  locale
}: PlatformRequirementsSelectorProps) {
  const t = useTranslations('service-creation')
  const [expandedPlatforms, setExpandedPlatforms] = useState<Record<DonationPlatform, boolean>>({
    justgiving: false,
    everyorg: false,
    acnc: false
  })
  
  const [organizations, setOrganizations] = useState<Record<DonationPlatform, OrganizationOption[]>>({
    justgiving: [],
    everyorg: [],
    acnc: []
  })
  
  const [organizationSearch, setOrganizationSearch] = useState<Record<DonationPlatform, string>>({
    justgiving: '',
    everyorg: '',
    acnc: ''
  })
  
  const [loadingOrganizations, setLoadingOrganizations] = useState<Record<DonationPlatform, boolean>>({
    justgiving: false,
    everyorg: false,
    acnc: false
  })

  const [pagination, setPagination] = useState<Record<DonationPlatform, PaginationState>>({
    justgiving: { page: 1, totalCount: 0, hasMore: false },
    everyorg: { page: 1, totalCount: 0, hasMore: false },
    acnc: { page: 1, totalCount: 0, hasMore: false }
  })

  const [isSelectingAll, setIsSelectingAll] = useState<Record<DonationPlatform, boolean>>({
    justgiving: false,
    everyorg: false,
    acnc: false
  })

  const ITEMS_PER_PAGE = 50

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
            specific_organizations: [],
            select_all_organizations: false,
            excluded_organizations: []
          },
          everyorg: {
            entity_types: 'specific_entities',
            allowed_entities: ['nonprofit'],
            organizations: 'specific_organizations',
            specific_organizations: [],
            select_all_organizations: false,
            excluded_organizations: []
          },
          acnc: {
            entity_types: 'specific_entities',
            allowed_entities: ['charity'],
            organizations: 'specific_organizations',
            specific_organizations: [],
            select_all_organizations: false,
            excluded_organizations: []
          }
        }
      }
      onChange(defaultRequirements)
    }
  }, [value, onChange])

  // Load organizations for a platform with search and pagination
  const loadOrganizations = useCallback(async (platform: DonationPlatform, loadMore: boolean = false, search: string = '') => {
    setLoadingOrganizations(prev => ({ ...prev, [platform]: true }))
    
    // Get current page from state
    const currentPagination = pagination[platform]
    const currentPage = loadMore ? currentPagination.page + 1 : 1
    const currentOrgs = loadMore ? organizations[platform] : []
    
    const supabase = createClient()
    let query = supabase
      .from('organization_cache')
      .select('id, name, platform, logo_url', { count: 'exact' })
      .eq('platform', platform)
      .eq('is_active', true)
      .order('name')
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)
    
    // Apply search filter if provided
    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }
    
    const { data, error, count } = await query
    
    if (!error && data) {
      const newOrgs = loadMore ? [...currentOrgs, ...data] : data
      setOrganizations(prev => ({
        ...prev,
        [platform]: newOrgs
      }))
      
      setPagination(prev => ({
        ...prev,
        [platform]: {
          page: currentPage,
          totalCount: count || 0,
          hasMore: (count || 0) > currentPage * ITEMS_PER_PAGE
        }
      }))
    }
    
    setLoadingOrganizations(prev => ({ ...prev, [platform]: false }))
  }, [])

  // Auto-expand platforms that have selected organizations and load their data  
  useEffect(() => {
    if (value) {
      value.allowed_platforms.forEach(platform => {
        const platformRule = value.platform_rules[platform]
        
        // Only process if this platform should be expanded and isn't already
        if (platformRule?.organizations === 'specific_organizations' && 
            (platformRule.specific_organizations.length > 0 || platformRule.select_all_organizations) &&
            !expandedPlatforms[platform]) {
          
          // Expand this platform
          setExpandedPlatforms(prev => ({
            ...prev,
            [platform]: true
          }))
          
          // Load organizations for this platform (only if we haven't loaded any yet)
          if (organizations[platform].length === 0) {
            loadOrganizations(platform, false, organizationSearch[platform])
          }
        }
      })
    }
  }, [value?.allowed_platforms])

  // Separate effect for select all state management (to prevent re-renders on org selection)
  useEffect(() => {
    if (value) {
      value.allowed_platforms.forEach(platform => {
        const platformRule = value.platform_rules[platform]
        const shouldSelectAll = Boolean(platformRule?.select_all_organizations)
        
        setIsSelectingAll(prev => {
          if (prev[platform] !== shouldSelectAll) {
            return { ...prev, [platform]: shouldSelectAll }
          }
          return prev
        })
      })
    }
  }, [value?.allowed_platforms, value?.platform_rules])

  // Debounced search effect - only run when search actually changes
  useEffect(() => {
    const timeouts: Record<DonationPlatform, NodeJS.Timeout> = {} as any
    
    Object.keys(organizationSearch).forEach((platformKey) => {
      const platform = platformKey as DonationPlatform
      const search = organizationSearch[platform]
      
      // Only set timeout if platform is expanded AND we have organizations loaded (indicating search should work)
      if (expandedPlatforms[platform] && organizations[platform].length > 0) {
        timeouts[platform] = setTimeout(() => {
          // Reset pagination and load with new search
          setPagination(prev => ({
            ...prev,
            [platform]: { page: 1, totalCount: 0, hasMore: false }
          }))
          loadOrganizations(platform, false, search)
        }, 300) // 300ms debounce
      }
    })
    
    return () => {
      Object.values(timeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [organizationSearch])

  const handleRestrictionTypeChange = (type: PlatformRestrictionType) => {
    const newRequirements: PlatformRequirements = {
      type,
      allowed_platforms: type === 'any_platform' ? ['justgiving', 'everyorg', 'acnc'] : [],
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
        },
        acnc: {
          entity_types: 'any_entities',
          allowed_entities: ['charity'],
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
      loadOrganizations(platform, false, organizationSearch[platform])
      
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
      loadOrganizations(platform, false, organizationSearch[platform])
    }
  }

  const handleOrganizationToggle = (platform: DonationPlatform, orgId: string) => {
    if (!value) return
    
    const platformRule = value.platform_rules[platform]
    
    if (platformRule.select_all_organizations) {
      // In "select all" mode - manage excluded organizations
      const currentExcluded = platformRule.excluded_organizations || []
      const isCurrentlyExcluded = currentExcluded.includes(orgId)
      
      const newExcluded = isCurrentlyExcluded
        ? currentExcluded.filter(id => id !== orgId) // Remove from excluded (select it)
        : [...currentExcluded, orgId] // Add to excluded (deselect it)
      
      const newPlatformRules = {
        ...value.platform_rules,
        [platform]: {
          ...value.platform_rules[platform],
          excluded_organizations: newExcluded
        }
      }
      
      onChange({
        ...value,
        platform_rules: newPlatformRules
      })
    } else {
      // Individual selection mode - manage specific organizations
      const currentOrgs = platformRule.specific_organizations
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
  }

  const handleSelectAll = (platform: DonationPlatform) => {
    if (!value) return
    
    // Set flag indicating all organizations are selected
    setIsSelectingAll(prev => ({ ...prev, [platform]: true }))
    
    const newPlatformRules = {
      ...value.platform_rules,
      [platform]: {
        ...value.platform_rules[platform],
        specific_organizations: [], // Clear specific selections
        select_all_organizations: true // Set the flag
      }
    }
    
    onChange({
      ...value,
      platform_rules: newPlatformRules
    })
  }

  const handleClearAll = (platform: DonationPlatform) => {
    if (!value) return
    
    // Clear both specific selections and select all flag
    setIsSelectingAll(prev => ({ ...prev, [platform]: false }))
    
    const newPlatformRules = {
      ...value.platform_rules,
      [platform]: {
        ...value.platform_rules[platform],
        specific_organizations: [],
        select_all_organizations: false,
        excluded_organizations: []
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
      everyorg: true,
      acnc: true
    })
    
    // Load organizations for all platforms
    loadOrganizations('justgiving')
    loadOrganizations('everyorg')
    loadOrganizations('acnc')
    
    onChange({
      ...value,
      allowed_platforms: ['justgiving', 'everyorg', 'acnc']
    })
  }

  const handleClearAllPlatforms = () => {
    if (!value) return
    
    // Clear all platforms and collapse them
    setExpandedPlatforms({
      justgiving: false,
      everyorg: false,
      acnc: false
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

  // Memoize filtered organizations to prevent unnecessary re-computations
  const filteredOrganizations = useMemo(() => {
    const getFilteredForPlatform = (platform: DonationPlatform) => {
      const search = organizationSearch[platform].toLowerCase()
      const filtered = organizations[platform].filter(org => 
        org.name.toLowerCase().includes(search)
      )
      
      const platformRule = value?.platform_rules[platform]
      if (!platformRule) return filtered
      
      if (platformRule.select_all_organizations) {
        // In select all mode: separate included and excluded organizations
        const excludedIds = platformRule.excluded_organizations || []
        const includedOrgs = filtered.filter(org => !excludedIds.includes(org.id))
        const excludedOrgs = filtered.filter(org => excludedIds.includes(org.id))
        
        // Return excluded organizations first (at top), then included ones
        return [...excludedOrgs, ...includedOrgs]
      } else {
        // In individual selection mode: separate selected and unselected organizations
        const selectedOrgIds = platformRule.specific_organizations || []
        const selectedOrgs = filtered.filter(org => selectedOrgIds.includes(org.id))
        const unselectedOrgs = filtered.filter(org => !selectedOrgIds.includes(org.id))
        
        // Return selected organizations first, then unselected ones
        return [...selectedOrgs, ...unselectedOrgs]
      }
    }
    
    return {
      justgiving: getFilteredForPlatform('justgiving'),
      everyorg: getFilteredForPlatform('everyorg'),
      acnc: getFilteredForPlatform('acnc')
    }
  }, [organizations, organizationSearch, value?.platform_rules])

  if (!value) return null

  const platformConfig = {
    justgiving: { name: 'JustGiving', color: 'blue', entityName: 'Charities' },
    everyorg: { name: 'Every.org', color: 'green', entityName: 'Nonprofits' },
    acnc: { name: 'ACNC', color: 'orange', entityName: 'Charities' }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Platform Requirements
        </label>
        
        {/* Platform-Specific Configuration */}
        <div className="mb-6">
          {/* Mobile-first header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Select Platform:</span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                type="button"
                onClick={handleSelectAllPlatforms}
                className="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-md transition-colors"
              >
                Select All Platforms
              </button>
              {value?.allowed_platforms.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllPlatforms}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile: Remove outer border, use full width sections */}
          <div className="space-y-4 md:border md:rounded-lg md:p-4">
            {(['justgiving', 'everyorg', 'acnc'] as DonationPlatform[]).map(platform => {
              const config = platformConfig[platform]
              const isSelected = value.allowed_platforms.includes(platform)
              const isExpanded = expandedPlatforms[platform]
              const rule = value.platform_rules[platform]
              
              return (
                <div key={platform} className="border rounded-lg md:rounded-lg bg-white shadow-sm md:shadow-none">
                  {/* Platform Header - Mobile optimized */}
                  <div className="flex items-center justify-between p-4 md:p-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handlePlatformToggle(platform)}
                        className="h-5 w-5 md:h-4 md:w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-2">
                        <span className="font-medium text-gray-900 text-base md:text-sm">{config.name}</span>
                        <span className="text-sm text-gray-500">({config.entityName})</span>
                      </div>
                    </div>
                    
                    {/* Mobile: Add expand/collapse indicator */}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => togglePlatformExpansion(platform)}
                        className="md:hidden p-1 text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Platform Details - Mobile optimized */}
                  {isSelected && isExpanded && (
                    <div className="px-4 pb-4 md:mt-4 md:ml-6 md:px-0 md:pb-0 space-y-4">
                      {/* Organization Selection */}
                      <div>
                        {/* Mobile: Remove extra container padding, use full width */}
                        <div className="bg-gray-50 rounded border -mx-4 md:mx-0 md:mt-3 md:p-3">
                          <div className="p-3 md:p-0">
                            {/* Search and Select All - Mobile optimized */}
                            <div className="space-y-3 md:space-y-0 md:flex md:items-center md:space-x-2 mb-4 md:mb-3">
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
                                  className="pl-10 pr-10 w-full px-3 py-3 md:py-2 text-sm md:text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                                {organizationSearch[platform] && (
                                  <button
                                    type="button"
                                    onClick={() => setOrganizationSearch(prev => ({
                                      ...prev,
                                      [platform]: ''
                                    }))}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    title="Clear search"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleSelectAll(platform)}
                                  className="flex-1 md:flex-none px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 border border-blue-300 rounded-md transition-colors"
                                >
                                  Select All
                                </button>
                                {(rule.specific_organizations.length > 0 || isSelectingAll[platform]) && (
                                  <button
                                    type="button"
                                    onClick={() => handleClearAll(platform)}
                                    className="flex-1 md:flex-none px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-md transition-colors"
                                  >
                                    Clear All
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Select All Status Banner */}
                          {isSelectingAll[platform] && (
                            <div className="mx-3 md:mx-0 mb-3 p-3 md:p-2 bg-blue-50 border border-blue-200 rounded text-sm md:text-xs text-blue-800">
                              {(rule.excluded_organizations || []).length > 0 ? (
                                <>✓ {pagination[platform].totalCount - (rule.excluded_organizations || []).length} of {pagination[platform].totalCount.toLocaleString()} organizations selected ({(rule.excluded_organizations || []).length} excluded)</>
                              ) : (
                                <>✓ All {pagination[platform].totalCount.toLocaleString()} organizations selected</>
                              )}
                            </div>
                          )}

                          {/* Organization List - Mobile optimized */}
                          <div className="max-h-60 md:max-h-40 overflow-y-auto space-y-1 px-3 md:px-0">
                            {loadingOrganizations[platform] ? (
                              <div className="text-xs text-gray-500 p-2">Loading organizations...</div>
                            ) : filteredOrganizations[platform].length === 0 ? (
                              <div className="text-xs text-gray-500 p-2">No organizations found</div>
                            ) : (
                              <>
                                {filteredOrganizations[platform].map((org, index) => {
                                  // Determine selection state based on mode
                                  const isSelected = rule.select_all_organizations 
                                    ? !(rule.excluded_organizations || []).includes(org.id) // Selected if not excluded
                                    : rule.specific_organizations.includes(org.id) // Selected if specifically included
                                  
                                  // Determine if organization is excluded (only relevant in select all mode)
                                  const isExcluded = rule.select_all_organizations && (rule.excluded_organizations || []).includes(org.id)
                                  
                                  const filtered = filteredOrganizations[platform]
                                  
                                  // Calculate separator position based on mode
                                  let separatorIndex = 0
                                  if (rule.select_all_organizations) {
                                    // In select all mode: separator after excluded organizations
                                    separatorIndex = (rule.excluded_organizations || []).length
                                  } else {
                                    // In individual mode: separator after selected organizations  
                                    separatorIndex = filtered.filter(o => rule.specific_organizations.includes(o.id)).length
                                  }
                                  
                                  // Show separator between excluded/included or selected/unselected
                                  const showSeparator = index === separatorIndex && separatorIndex > 0 && separatorIndex < filtered.length
                                  
                                  return (
                                    <div key={org.id}>
                                      {showSeparator && (
                                        <div className="flex items-center my-2">
                                          <div className="flex-1 h-px bg-gray-200"></div>
                                          <span className="px-2 text-xs text-gray-500 bg-white">
                                            {rule.select_all_organizations ? 'Included organizations' : 'Other organizations'}
                                          </span>
                                          <div className="flex-1 h-px bg-gray-200"></div>
                                        </div>
                                      )}
                                      <label className={`flex items-center p-3 md:p-2 rounded cursor-pointer transition-colors ${
                                        isExcluded
                                          ? 'bg-red-50 hover:bg-red-100 border border-red-200' // Red styling for excluded
                                          : isSelected 
                                            ? 'bg-blue-50 hover:bg-blue-100 border border-blue-200' // Blue styling for selected
                                            : 'hover:bg-gray-100 border border-transparent' // Default styling
                                      }`}>
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={() => handleOrganizationToggle(platform, org.id)}
                                          className="h-4 w-4 md:h-3 md:w-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <div className="ml-3 md:ml-2 flex items-center space-x-2 md:space-x-2 flex-1 min-w-0">
                                          {org.logo_url && (
                                            <img 
                                              src={org.logo_url} 
                                              alt={org.name}
                                              className="h-6 w-6 md:h-4 md:w-4 rounded object-cover flex-shrink-0"
                                              onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                              }}
                                            />
                                          )}
                                          <span className={`text-sm md:text-xs truncate ${
                                            isExcluded 
                                              ? 'text-red-800 font-medium line-through' // Red and strikethrough for excluded
                                              : isSelected 
                                                ? 'text-blue-800 font-medium' // Blue for selected
                                                : 'text-gray-700' // Default
                                          }`}>
                                            {org.name}
                                            {isExcluded && <span className="ml-1 text-red-600 text-sm md:text-xs">✕ Excluded</span>}
                                          </span>
                                        </div>
                                      </label>
                                    </div>
                                  )
                                })}

                                {/* Load More Button */}
                                {pagination[platform].hasMore && !loadingOrganizations[platform] && (
                                  <button
                                    type="button"
                                    onClick={() => loadOrganizations(platform, true, organizationSearch[platform])}
                                    className="w-full p-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors"
                                  >
                                    Load More Organizations...
                                  </button>
                                )}
                              </>
                            )}
                          </div>

                          {/* Selection Status - Mobile optimized */}
                          <div className="mt-3 md:mt-2 px-3 md:px-0 flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0 text-sm md:text-xs text-gray-600">
                            <div>
                              {isSelectingAll[platform] ? (
                                (rule.excluded_organizations || []).length > 0 ? (
                                  <span>Selected: {pagination[platform].totalCount - (rule.excluded_organizations || []).length} organizations ({(rule.excluded_organizations || []).length} excluded from all)</span>
                                ) : (
                                  <span>All organizations selected ({pagination[platform].totalCount.toLocaleString()})</span>
                                )
                              ) : rule.specific_organizations.length > 0 ? (
                                <span>Selected: {rule.specific_organizations.length} organizations</span>
                              ) : (
                                <span>No organizations selected</span>
                              )}
                            </div>
                            {pagination[platform].totalCount > 0 && (
                              <div className="text-gray-500">
                                Showing {filteredOrganizations[platform].length} of {pagination[platform].totalCount.toLocaleString()}
                              </div>
                            )}
                          </div>
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