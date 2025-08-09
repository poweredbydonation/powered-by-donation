'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { DonationPlatform } from '@/types/database'

interface PlatformOption {
  value: DonationPlatform
  label: string
  shortLabel: string
  available: boolean
  description: string
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    value: 'justgiving',
    label: 'JustGiving',
    shortLabel: 'JG',
    available: true,
    description: 'Available Now'
  },
  {
    value: 'every_org',
    label: 'Every.org',
    shortLabel: 'EV',
    available: true,
    description: 'Available Now'
  }
]

interface PlatformSelectorProps {
  onPlatformChange?: (platform: DonationPlatform) => void
}

export default function PlatformSelector({ onPlatformChange }: PlatformSelectorProps) {
  const [currentPlatform, setCurrentPlatform] = useState<DonationPlatform>('justgiving')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    // Load user's platform preference
    async function loadUserPlatform() {
      if (!user) {
        setCurrentPlatform('justgiving')
        return
      }

      const supabase = createClient()
      try {
        const { data: userProfile } = await supabase
          .from('users')
          .select('preferred_platform')
          .eq('id', user.id)
          .single()
        
        const platform = userProfile?.preferred_platform || 'justgiving'
        setCurrentPlatform(platform)
      } catch (err) {
        setCurrentPlatform('justgiving')
      }
    }

    loadUserPlatform()
  }, [user])

  const handlePlatformChange = async (platform: DonationPlatform) => {
    setCurrentPlatform(platform)
    setIsOpen(false)

    // Update user preference in database if authenticated
    if (user) {
      const supabase = createClient()
      try {
        await supabase
          .from('users')
          .update({ preferred_platform: platform })
          .eq('id', user.id)
      } catch (err) {
        console.error('Error updating platform preference:', err)
      }
    }

    // Notify parent component
    if (onPlatformChange) {
      onPlatformChange(platform)
    }

    // Refresh the page to update service listings
    window.location.reload()
  }

  const currentOption = PLATFORM_OPTIONS.find(p => p.value === currentPlatform) || PLATFORM_OPTIONS[0]
  const otherOptions = PLATFORM_OPTIONS.filter(p => p.value !== currentPlatform)

  if (!mounted) {
    return (
      <div className="animate-pulse bg-gray-200 h-6 w-8 rounded-full"></div>
    )
  }

  return (
    <div ref={dropdownRef} className="relative flex justify-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
      >
        <span className="bg-gray-100 hover:bg-gray-200 text-xs font-medium text-gray-700 px-2 py-1 rounded-full transition-colors">
          {currentOption.label}
        </span>
      </button>
      
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
          {otherOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => option.available ? handlePlatformChange(option.value) : null}
              disabled={!option.available}
              className={`flex items-center justify-between w-full px-4 py-2 text-left transition-colors ${
                option.available 
                  ? 'hover:bg-gray-50 cursor-pointer' 
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div>
                <span className="text-sm font-medium">{option.label}</span>
                <div className="text-xs text-gray-500">{option.description}</div>
              </div>
            </button>
          ))}
          
          <div className="border-t border-gray-100 px-4 py-2">
            <div className="text-xs text-gray-500">
              Current: <span className="font-medium text-gray-700">{currentOption.label}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}