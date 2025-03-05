'use client'

import { useState, useEffect } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import { PencilIcon } from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/outline'

// Define the exact structure expected by the database
interface CompanyData {
  business_type: string | null
  industry: string | null
  target_audience: string | null
  company_description: string | null
  brand_voice: string | null
  key_products: string[] | null
  competitors: string[] | null
  summary?: string | null
  location_id?: string
  updated_at?: string | null
}

const questions = [
  {
    field: 'business_type' as keyof CompanyData,
    question: 'If someone asked you, "What kind of business do you have?" what would you say in just a sentence or two?',
    placeholder: 'e.g., "We are a mobile pet grooming service that brings professional care right to your doorstep."'
  },
  {
    field: 'industry' as keyof CompanyData,
    question: 'What field or area does your business belong to?',
    placeholder: 'e.g., healthcare, home services, fashion, technology, etc.'
  },
  {
    field: 'target_audience' as keyof CompanyData,
    question: 'Imagine your absolute perfect customer—the one you dream of meeting. What makes them so perfect? What are they looking for? How old are they? Tell me as much as you can about them!',
    placeholder: 'Describe your ideal customer in detail...'
  },
  {
    field: 'company_description' as keyof CompanyData,
    question: 'If you met someone who had never heard of your business before, how would you explain it in a way that excites them?',
    placeholder: 'Share what makes your business special...'
  },
  {
    field: 'brand_voice' as keyof CompanyData,
    question: 'If your business could talk, what kind of personality would it have? Would it be friendly and casual? Professional and serious? Playful and fun? Tell me how you would like people to feel when they hear from you!',
    placeholder: 'Describe your brand\'s personality...'
  },
  {
    field: 'key_products' as keyof CompanyData,
    question: 'What are the main things you sell or offer? If someone came to you for the first time, what would you want them to know about right away?',
    placeholder: 'List your main products or services...'
  },
  {
    field: 'competitors' as keyof CompanyData,
    question: 'Are there any businesses out there that offer something similar to what you do? They don\'t have to be exactly the same—just anyone your customers might compare you to.',
    placeholder: 'Name some similar businesses in your space...'
  }
]

export default function CompanyModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>('My Company')
  const [isEditingName, setIsEditingName] = useState(false)
  const { locationId } = useLocation()
  const [showingSurvey, setShowingSurvey] = useState(false)
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // Initialize with null values for all fields
  const [answers, setAnswers] = useState<CompanyData>({
    business_type: null,
    industry: null,
    target_audience: null,
    company_description: null,
    brand_voice: null,
    key_products: null,
    competitors: null,
    location_id: locationId,
    updated_at: new Date().toISOString()
  })

  useEffect(() => {
    if (!locationId || !isOpen) return

    const fetchInitialData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch company name
        const nameResponse = await fetch(`/api/update-company-name?locationId=${locationId}`)
        const nameData = await nameResponse.json()
        
        if (nameResponse.ok && nameData.companyName) {
          setCompanyName(nameData.companyName)
        }
        
        // Fetch company data
        const response = await fetch(`/api/company-data?locationId=${locationId}`)
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch company data')
        }

        if (data && Object.keys(data).length > 0) {
          setAnswers(data)
          // If no summary exists, generate one
          if (!data.summary) {
            await generateSummary()
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
      const response = await fetch('/api/generate-summary', {
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
        summary: typeof data.summary === 'string' ? data.summary : 
                 typeof data.summary === 'object' ? 
                 `${data.summary.overview}\n\n${data.summary.targetMarket}\n\n${data.summary.marketPosition}\n\n${data.summary.brandCommunication}` :
                 'Invalid summary format'
      }))

    } catch (error: any) {
      console.error('Error generating summary:', error)
      setError(error.message || 'Failed to generate summary')
      // If summary generation fails, show the survey
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
    
    setIsEnhancing(true)
    setError(null)
    
    try {
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

      // Create a new answers object with the enhanced answer
      const enhancedAnswer = data.enhancedAnswer || null
      
      const updatedAnswers: CompanyData = {
        ...answers,
        [currentField]: (currentField === 'key_products' || currentField === 'competitors') && enhancedAnswer 
          ? enhancedAnswer.split(',').map((item: string) => item.trim())
          : enhancedAnswer,
        updated_at: new Date().toISOString()
      }
      
      // Update state
      setAnswers(updatedAnswers)

      // Save to database through API
      const saveResponse = await fetch('/api/company-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_type: updatedAnswers.business_type?.trim() || null,
          industry: updatedAnswers.industry?.trim() || null,
          target_audience: updatedAnswers.target_audience?.trim() || null,
          company_description: updatedAnswers.company_description?.trim() || null,
          brand_voice: updatedAnswers.brand_voice?.trim() || null,
          key_products: Array.isArray(updatedAnswers.key_products) 
            ? updatedAnswers.key_products 
            : updatedAnswers.key_products?.split(',').map(item => item.trim()) || null,
          competitors: Array.isArray(updatedAnswers.competitors)
            ? updatedAnswers.competitors
            : updatedAnswers.competitors?.split(',').map(item => item.trim()) || null,
          location_id: locationId,
          updated_at: updatedAnswers.updated_at
        })
      })

      const saveData = await saveResponse.json()

      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save enhanced answer')
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
    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      // This is the last step
      try {
        setShowingSurvey(false)
        setIsGeneratingSummary(true)
        setAnswers(prev => ({
          ...prev,
          summary: "Generating your company summary..."
        }))

        const response = await fetch('/api/company-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(answers)
        })

        if (!response.ok) {
          throw new Error('Failed to save company data')
        }

        // Generate summary after saving
        await generateSummary()
      } catch (error: any) {
        console.error('Error saving company data:', error)
        setError(error.message || 'Failed to save company data')
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
      business_type: currentAnswers.business_type,
      industry: currentAnswers.industry,
      target_audience: currentAnswers.target_audience,
      company_description: currentAnswers.company_description,
      brand_voice: currentAnswers.brand_voice,
      key_products: currentAnswers.key_products,
      competitors: currentAnswers.competitors,
      location_id: locationId,
      updated_at: new Date().toISOString()
    })
    setCurrentStep(0)
    setShowingSurvey(true)
  }

  const handleUpdateCompanyName = async () => {
    try {
      const response = await fetch('/api/update-company-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          companyName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update company name')
      }

      setIsEditingName(false)
    } catch (error: any) {
      console.error('Error updating company name:', error)
      setError(error.message || 'Failed to update company name')
    }
  }

  if (!showingSurvey && answers.summary) {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-[--surface] rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[--border]">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-[--text]">
                {isEditingName ? (
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    onBlur={() => setIsEditingName(false)}
                    className="border rounded px-2 py-1 bg-[--input-background] text-[--text]"
                    autoFocus
                  />
                ) : (
                  <span className="flex items-center gap-2">
                    {companyName}
                    <button onClick={() => setIsEditingName(true)} className="text-[--text-secondary] hover:text-[--text]">
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </span>
                )}
              </h2>
            </div>
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
                  <h3 className="text-lg font-medium text-[--text]">Company Summary</h3>
                  <button
                    onClick={startNewSurvey}
                    className="px-4 py-2 text-sm font-medium text-[--text] bg-[--primary] rounded-md hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary]"
                  >
                    Redo Survey
                  </button>
                </div>
                <div className="bg-[--surface-elevated] rounded-lg p-6 overflow-y-auto max-h-[50vh] whitespace-pre-wrap text-[--text]">
                  {isGeneratingSummary ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--text]" />
                      <p className="text-[--text] text-center">
                        Generating your comprehensive company summary...
                        <br />
                        <span className="text-sm text-[--text-secondary]">This may take a few moments</span>
                      </p>
                    </div>
                  ) : (
                    answers.summary || 'No summary available.'
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
        </div>
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-[--text]">
              {isEditingName ? (
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                  className="border rounded px-2 py-1 bg-[--input-background] text-[--text]"
                  autoFocus
                />
              ) : (
                <span className="flex items-center gap-2">
                  {companyName}
                  <button onClick={() => setIsEditingName(true)} className="text-[--text-secondary] hover:text-[--text]">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                </span>
              )}
            </h2>
          </div>
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
          ) : showingSurvey ? (
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
          ) : (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-[--text]">Company Summary</h3>
                <button
                  onClick={startNewSurvey}
                  className="px-4 py-2 text-sm font-medium text-[--text] bg-[--primary] rounded-md hover:bg-[--primary-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[--primary]"
                >
                  Redo Survey
                </button>
              </div>
              <div className="bg-[--surface-elevated] rounded-lg p-6 overflow-y-auto max-h-[50vh] whitespace-pre-wrap text-[--text]">
                {isGeneratingSummary ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[--text]" />
                    <p className="text-[--text] text-center">
                      Generating your comprehensive company summary...
                      <br />
                      <span className="text-sm text-[--text-secondary]">This may take a few moments</span>
                    </p>
                  </div>
                ) : (
                  answers.summary || 'No summary available.'
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {showingSurvey && (
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
        )}
      </div>
    </div>
  )
}
