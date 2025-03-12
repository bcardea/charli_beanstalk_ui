'use client'

import { useEffect, useState } from 'react'
import { useLocation } from '@/contexts/LocationContext'

interface TargetCustomerProfile {
  name: string
  age: number
  position: string
  company_size: string
  industry: string
  goals: string[]
  challenges: string[]
  interests: string[]
  preferred_channels: string[]
  decision_factors: string[]
  budget_range: string
  profile_description: string
  profile_image_url: string
}

export default function TargetCustomerModal({
  isOpen,
  onClose,
  marketSummary
}: {
  isOpen: boolean
  onClose: () => void
  marketSummary: any
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<TargetCustomerProfile | null>(null)
  const { locationId } = useLocation()

  useEffect(() => {
    if (isOpen && locationId) {
      fetchExistingProfile()
    }
  }, [isOpen, locationId])

  const fetchExistingProfile = async () => {
    try {
      const response = await fetch(`/api/get-target-customer?locationId=${locationId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile')
      }

      if (data.profile) {
        setProfile(data.profile)
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error)
      // Don't show error to user since this is just initial load
    }
  }

  const generateProfile = async () => {
    if (!locationId) {
      setError('Location ID is not available')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-target-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          marketSummary
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate profile')
      }

      setProfile(data.profile)
    } catch (error: any) {
      console.error('Error generating profile:', error)
      setError(error.message || 'Failed to generate profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[--surface] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[--border]">
          <h2 className="text-xl font-semibold text-[--text]">Target Customer Profile</h2>
          <button onClick={onClose} className="text-[--text-secondary] hover:text-[--text]">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--text]" />
              <p className="text-[--text] text-center">
                Generating your target customer profile...
                <br />
                <span className="text-sm text-[--text-secondary]">This may take a few moments</span>
              </p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center">{error}</div>
          ) : !profile ? (
            <div className="flex flex-col items-center justify-center gap-6 py-8">
              <p className="text-[--text] text-center max-w-lg">
                Based on your target market summary, we can create a detailed persona of your ideal customer.
                This will help you better understand and connect with your target audience.
              </p>
              <button
                onClick={generateProfile}
                className="px-6 py-3 text-[--text] bg-[--primary] rounded-md hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary]"
              >
                Generate Customer Profile
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={generateProfile}
                  className="px-4 py-2 text-sm text-[--text] bg-[--primary] rounded-md hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary]"
                >
                  Regenerate Profile
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Image and Basic Info */}
                <div className="space-y-6">
                  <div className="aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden bg-[--surface-elevated] shadow-lg">
                    {profile.profile_image_url && (
                      <img
                        src={profile.profile_image_url}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-semibold text-[--text]">{profile.name}</h3>
                    <p className="text-[--text-secondary]">{profile.age} years old</p>
                    <p className="text-[--text]">{profile.position}</p>
                    <p className="text-[--text-secondary]">{profile.industry} • {profile.company_size}</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">About</h4>
                    <p className="text-[--text] whitespace-pre-wrap">{profile.profile_description}</p>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">Goals</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {profile.goals.map((goal, index) => (
                        <li key={index} className="text-[--text]">{goal}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">Challenges</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {profile.challenges.map((challenge, index) => (
                        <li key={index} className="text-[--text]">{challenge}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">Interests</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {profile.interests.map((interest, index) => (
                        <li key={index} className="text-[--text]">{interest}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">Communication Preferences</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {profile.preferred_channels.map((channel, index) => (
                        <li key={index} className="text-[--text]">{channel}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">Decision Factors</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {profile.decision_factors.map((factor, index) => (
                        <li key={index} className="text-[--text]">{factor}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-[--text] mb-2">Budget Range</h4>
                    <p className="text-[--text]">{profile.budget_range}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
