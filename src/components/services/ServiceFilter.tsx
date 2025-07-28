'use client'

import { useState } from 'react'

export interface ServiceFilters {
  category?: string
  location?: string
  minAmount?: number
  maxAmount?: number
  minHappiness?: number
  locationType?: 'all' | 'remote' | 'physical' | 'hybrid'
  charityRequirement?: 'all' | 'any_charity' | 'specific_charities'
}

interface ServiceFilterProps {
  filters: ServiceFilters
  onFiltersChange: (filters: ServiceFilters) => void
  onClearFilters: () => void
}

// Common service categories - could be moved to constants file later
const SERVICE_CATEGORIES = [
  'Web Design',
  'Tutoring',
  'Consulting',
  'Writing',
  'Photography',
  'Marketing',
  'Development',
  'Design',
  'Business',
  'Health & Wellness',
  'Education',
  'Technology',
  'Creative',
  'Other'
]

export default function ServiceFilter({ filters, onFiltersChange, onClearFilters }: ServiceFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const updateFilter = (key: keyof ServiceFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value || undefined
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '' && value !== 'all')

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Filter Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">Filter Services</h3>
            {hasActiveFilters && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={onClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm text-blue-600 hover:text-blue-700 md:hidden"
            >
              {isExpanded ? 'Hide filters' : 'Show filters'}
            </button>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={`px-6 py-4 ${isExpanded ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={filters.category || ''}
              onChange={(e) => updateFilter('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All categories</option>
              {SERVICE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={filters.location || ''}
              onChange={(e) => updateFilter('location', e.target.value)}
              placeholder="e.g. Sydney, Melbourne"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Location Type Filter */}
          <div>
            <label htmlFor="locationType" className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              id="locationType"
              value={filters.locationType || 'all'}
              onChange={(e) => updateFilter('locationType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All types</option>
              <option value="remote">Remote only</option>
              <option value="physical">In-person only</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>

          {/* Charity Requirement Filter */}
          <div>
            <label htmlFor="charityRequirement" className="block text-sm font-medium text-gray-700 mb-2">
              Charity Choice
            </label>
            <select
              id="charityRequirement"
              value={filters.charityRequirement || 'all'}
              onChange={(e) => updateFilter('charityRequirement', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Any requirement</option>
              <option value="any_charity">Choose any charity</option>
              <option value="specific_charities">Provider's preferred charities</option>
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Donation Amount Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="minAmount" className="block text-xs text-gray-500 mb-1">
                Minimum
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="minAmount"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="0"
                  min="0"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label htmlFor="maxAmount" className="block text-xs text-gray-500 mb-1">
                Maximum
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="maxAmount"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="1000"
                  min="0"
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Happiness Rating */}
        <div className="mt-6">
          <label htmlFor="minHappiness" className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Provider Rating
          </label>
          <select
            id="minHappiness"
            value={filters.minHappiness || ''}
            onChange={(e) => updateFilter('minHappiness', e.target.value ? parseInt(e.target.value) : undefined)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Any rating</option>
            <option value="90">90% or higher</option>
            <option value="80">80% or higher</option>
            <option value="70">70% or higher</option>
            <option value="60">60% or higher</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Based on supporter satisfaction ratings
          </p>
        </div>
      </div>
    </div>
  )
}