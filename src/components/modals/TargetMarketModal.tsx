'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import { SparklesIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import TargetCustomerModal from './TargetCustomerModal'

// Define the exact structure expected by the database
interface TargetMarketData {
  demographics: string | null
  psychographics: string | null
  pain_points: string | null
  buying_behavior: string | null
  market_size: string | null
  growth_potential: string | null
  geographic_focus: string | null
  summary?: string | null
  location_id?: string
  updated_at?: string | null
}

interface FormattedContent {
  type: string
  text: string
  items?: string[]
}

interface Section {
  title: string
  content: FormattedContent[]
}

interface TargetMarketSummary {
  sections: Section[]
}

const questions = [
  {
    field: 'demographics' as keyof TargetMarketData,
    question: 'Who are your ideal customers in terms of age, gender, income, education, occupation, and other demographic factors?',
    placeholder: 'e.g., "Our ideal customers are urban professionals aged 25-40, with college degrees and annual incomes over $75,000..."'
  },
  {
    field: 'psychographics' as keyof TargetMarketData,
    question: 'What are your ideal customers\' interests, values, lifestyle choices, and personality traits?',
    placeholder: 'e.g., "They are health-conscious individuals who value work-life balance, enjoy outdoor activities..."'
  },
  {
    field: 'pain_points' as keyof TargetMarketData,
    question: 'What specific problems or challenges does your target market face that your business helps solve?',
    placeholder: 'Describe the key problems or needs your customers have...'
  },
  {
    field: 'buying_behavior' as keyof TargetMarketData,
    question: 'How do your ideal customers typically make purchasing decisions? What factors influence their choices?',
    placeholder: 'e.g., "They research extensively online, value peer recommendations..."'
  },
  {
    field: 'market_size' as keyof TargetMarketData,
    question: 'How large is your potential market? Can you estimate the number of potential customers in your target area?',
    placeholder: 'Describe the size of your target market...'
  },
  {
    field: 'growth_potential' as keyof TargetMarketData,
    question: 'What trends or factors suggest growth potential in your target market?',
    placeholder: 'e.g., "The market is expected to grow by 20% annually due to increasing demand..."'
  },
  {
    field: 'geographic_focus' as keyof TargetMarketData,
    question: 'What geographic areas do you target? Consider local, regional, or online presence.',
    placeholder: 'Describe your geographic target areas...'
  }
]

export default function TargetMarketModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const { locationId } = useLocation()
  const [showingSurvey, setShowingSurvey] = useState(false)

  // Initialize with null values for all fields
  const [answers, setAnswers] = useState<TargetMarketData>({
    demographics: null,
    psychographics: null,
    pain_points: null,
    buying_behavior: null,
    market_size: null,
    growth_potential: null,
    geographic_focus: null,
    location_id: locationId,
    updated_at: new Date().toISOString()
  })

  const [isTargetCustomerModalOpen, setIsTargetCustomerModalOpen] = useState(false)
  const [parsedSummary, setParsedSummary] = useState<TargetMarketSummary | null>(null)

  useEffect(() => {
    if (!locationId || !isOpen) return

    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch target market data
        const response = await fetch(`/api/target-market?locationId=${locationId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch target market data')
        }

        if (data && Object.keys(data).length > 0) {
          setAnswers(data)
          // If summary exists, parse it
          if (data.summary) {
            try {
              const parsed = JSON.parse(data.summary)
              // Validate the parsed summary structure
              if (parsed && parsed.sections && Array.isArray(parsed.sections)) {
                setParsedSummary(parsed)
              } else {
                console.error('Invalid summary structure:', parsed)
                setParsedSummary(null)
                // Regenerate the summary if it's invalid
                await generateSummary()
              }
            } catch (e) {
              console.error('Error parsing summary:', e)
              setParsedSummary(null)
              // Regenerate the summary if parsing fails
              await generateSummary()
            }
          }
          setShowingSurvey(false)
        } else {
          // If no data exists, show the survey
          setShowingSurvey(true)
        }
      } catch (error: any) {
        console.error('Error fetching initial data:', error)
        setError(error.message || 'Failed to fetch data')
        setShowingSurvey(true)
      } finally {
        setIsLoading(false)
      }
    }

    fetchInitialData()
  }, [locationId, isOpen])

  const generateSummary = async () => {
    setIsGeneratingSummary(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-target-market-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary')
      }

      if (!data.summary) {
        throw new Error('No summary generated')
      }

      // Update answers with new summary
      setAnswers(prev => ({
        ...prev,
        summary: data.summary
      }))

    } catch (error: any) {
      console.error('Error generating summary:', error)
      setError(error.message || 'Failed to generate summary')
      setShowingSurvey(true)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleEnhanceAnswer = async () => {
    const currentField = questions[currentStep].field
    const currentAnswer = answers[currentField]
    
    if (!currentAnswer?.toString().trim()) {
      setError('Please provide an answer first')
      return
    }

    if (!locationId) {
      setError('Location ID is not available')
      return
    }
    
    setIsEnhancing(true)
    setError(null)
    
    try {
      // Save current answer first
      const saveResponse = await fetch('/api/target-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...answers,
          [currentField]: currentAnswer,
          location_id: locationId,
          updated_at: new Date().toISOString()
        })
      })

      if (!saveResponse.ok) {
        const saveData = await saveResponse.json()
        throw new Error(saveData.error || 'Failed to save answer')
      }

      // Get enhanced answer from Gemini
      const response = await fetch('/api/enhance-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answer: currentAnswer,
          question: questions[currentStep].question
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enhance answer')
      }

      // Update state with enhanced answer
      const enhancedAnswer = data.enhancedAnswer || null
      
      const updatedAnswers: TargetMarketData = {
        ...answers,
        [currentField]: enhancedAnswer,
        location_id: locationId,
        updated_at: new Date().toISOString()
      }
      
      setAnswers(updatedAnswers)

      // Save enhanced answer
      const enhancedSaveResponse = await fetch('/api/target-market', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAnswers)
      })

      if (!enhancedSaveResponse.ok) {
        const enhancedSaveData = await enhancedSaveResponse.json()
        throw new Error(enhancedSaveData.error || 'Failed to save enhanced answer')
      }

    } catch (error: any) {
      console.error('Error enhancing answer:', error)
      setError(error.message || 'Failed to enhance answer')
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleAnswerChange = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentStep].field]: value
    }))
  }

  const handleNext = async () => {
    if (!locationId) {
      setError('Location ID is not available')
      return
    }

    if (currentStep < questions.length - 1) {
      // Save current progress before moving to next step
      try {
        const response = await fetch('/api/target-market', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...answers,
            location_id: locationId,
            updated_at: new Date().toISOString()
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to save progress')
        }

        setCurrentStep(prev => prev + 1)
      } catch (error: any) {
        console.error('Error saving progress:', error)
        setError(error.message || 'Failed to save progress')
      }
    } else {
      // This is the last step
      try {
        setShowingSurvey(false)
        setIsGeneratingSummary(true)
        setAnswers(prev => ({
          ...prev,
          summary: "Generating your target market summary..."
        }))

        const response = await fetch('/api/target-market', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...answers,
            location_id: locationId,
            updated_at: new Date().toISOString()
          })
        })

        if (!response.ok) {
          throw new Error('Failed to save target market data')
        }

        // Generate summary after saving
        await generateSummary()
      } catch (error: any) {
        console.error('Error saving target market data:', error)
        setError(error.message || 'Failed to save target market data')
        setShowingSurvey(true)
      }
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const startNewSurvey = () => {
    // Keep existing answers when starting new survey
    const currentAnswers = { ...answers }
    setAnswers({
      demographics: currentAnswers.demographics,
      psychographics: currentAnswers.psychographics,
      pain_points: currentAnswers.pain_points,
      buying_behavior: currentAnswers.buying_behavior,
      market_size: currentAnswers.market_size,
      growth_potential: currentAnswers.growth_potential,
      geographic_focus: currentAnswers.geographic_focus,
      location_id: locationId,
      updated_at: new Date().toISOString()
    })
    setCurrentStep(0)
    setShowingSurvey(true)
  }

  if (!showingSurvey && answers.summary) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[--surface] rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[--border]">
            <h2 className="text-xl font-semibold text-[--text]">Target Market Profile</h2>
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
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--text]" />
              </div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-[--text]">Target Market Summary</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsTargetCustomerModalOpen(true)}
                      className="px-4 py-2 text-sm font-medium text-[--text] bg-[--surface-elevated] border border-[--border] rounded-md hover:bg-[--surface-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary] flex items-center gap-2"
                    >
                      <UserCircleIcon className="h-5 w-5" />
                      Create Customer Profile
                    </button>
                    <button
                      onClick={startNewSurvey}
                      className="px-4 py-2 text-sm font-medium text-[--text] bg-[--primary] rounded-md hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary]"
                    >
                      Redo Survey
                    </button>
                  </div>
                </div>
                <div className="bg-[--surface-elevated] rounded-lg p-6 overflow-y-auto max-h-[50vh]">
                  {isGeneratingSummary ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--text]" />
                      <p className="text-[--text] text-center">
                        Generating your comprehensive target market summary...
                        <br />
                        <span className="text-sm text-[--text-secondary]">This may take a few moments</span>
                      </p>
                    </div>
                  ) : parsedSummary ? (
                    <div className="space-y-8">
                      {parsedSummary.sections.map((section, index) => (
                        <div key={index} className="space-y-4">
                          <h2 className="text-xl font-semibold text-[--text] border-b border-[--border] pb-2">
                            {section.title}
                          </h2>
                          <div className="space-y-4">
                            {section.content.map((content, contentIndex) => {
                              if (content.type === 'h1') {
                                return <h1 key={contentIndex} className="text-2xl font-bold text-[--text]">{content.text}</h1>
                              } else if (content.type === 'h2') {
                                return <h2 key={contentIndex} className="text-xl font-semibold text-[--text]">{content.text}</h2>
                              } else if (content.type === 'h3') {
                                return <h3 key={contentIndex} className="text-lg font-medium text-[--text]">{content.text}</h3>
                              } else if (content.type === 'paragraph') {
                                return <p key={contentIndex} className="text-[--text]">{content.text}</p>
                              } else if (content.type === 'list' && content.items) {
                                return (
                                  <ul key={contentIndex} className="list-disc list-inside space-y-2">
                                    {content.items.map((item, itemIndex) => (
                                      <li key={itemIndex} className="text-[--text]">{item}</li>
                                    ))}
                                  </ul>
                                )
                              }
                              return null
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[--text]">No summary available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <TargetCustomerModal
          isOpen={isTargetCustomerModalOpen}
          onClose={() => setIsTargetCustomerModalOpen(false)}
          marketSummary={parsedSummary}
        />
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center`}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[--surface] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[--border]">
          <h2 className="text-xl font-semibold text-[--text]">Target Market Survey</h2>
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
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--text]" />
            </div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <div className="space-y-8">
              {/* Progress bar */}
              <div className="relative h-1 bg-gray-200 rounded-full mb-6">
                <div
                  className="absolute h-1 bg-orange-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>

              {/* Question */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[--text]">
                  {questions[currentStep].question}
                </h3>
                <div className="space-y-2">
                  <textarea
                    className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[--input-background] text-[--text] placeholder:text-[--text-secondary]"
                    placeholder={questions[currentStep].placeholder}
                    value={answers[questions[currentStep].field] || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                  />
                  <button
                    onClick={handleEnhanceAnswer}
                    className="w-full px-4 py-2 text-sm font-medium text-[--text] bg-gradient-to-r from-orange-400 to-orange-500 rounded-md hover:from-orange-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!answers[questions[currentStep].field] || isEnhancing}
                  >
                    {isEnhancing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="w-4 h-4" />
                        Enhance with Charli
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t border-[--border] bg-[--surface-elevated]">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              currentStep === 0
                ? 'text-[--text-disabled] bg-[--surface-elevated]'
                : 'text-[--text] bg-[--surface] border border-[--border] hover:bg-[--surface-hover]'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium text-[--text] bg-[--primary] rounded-md hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary]"
          >
            {currentStep === questions.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
