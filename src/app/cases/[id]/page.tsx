'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { casesAPI, sessionsAPI } from '@/lib/api'
import { ICaseTemplate } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const caseId = params.id as string
  
  const [caseTemplate, setCaseTemplate] = useState<ICaseTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [startingSession, setStartingSession] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await casesAPI.getCase(caseId)
        setCaseTemplate(response.case)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load case')
      } finally {
        setLoading(false)
      }
    }

    if (user && caseId) {
      fetchCase()
    }
  }, [user, caseId])

  const handleStartCase = async () => {
    if (!caseTemplate) return
    
    setStartingSession(true)
    try {
      const response = await sessionsAPI.createSession({ caseTemplateId: caseTemplate._id })
      router.push(`/chat/${response.session._id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setStartingSession(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (error || !caseTemplate) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The case you are looking for does not exist.'}</p>
            <Button onClick={() => router.push('/cases')}>
              Back to Cases
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{caseTemplate.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-gray-600">{caseTemplate.industry}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                caseTemplate.difficulty === 'beginner' 
                  ? 'bg-green-100 text-green-800'
                  : caseTemplate.difficulty === 'intermediate'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {caseTemplate.difficulty}
              </span>
              <span className="text-sm text-gray-500">
                ~{caseTemplate.estimatedDuration} minutes
              </span>
            </div>
          </div>
          
          <Button variant="outline" onClick={() => router.push('/cases')}>
            Back to Cases
          </Button>
        </div>
      </div>

      {/* Case Overview */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Case Overview</h2>
        <p className="text-gray-700 mb-6 leading-relaxed">{caseTemplate.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{caseTemplate.difficulty}</div>
            <div className="text-sm text-gray-600">Difficulty Level</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{caseTemplate.estimatedDuration}</div>
            <div className="text-sm text-gray-600">Minutes</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-primary-600">{caseTemplate.industry}</div>
            <div className="text-sm text-gray-600">Industry</div>
          </div>
        </div>

        {caseTemplate.tags && caseTemplate.tags.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {caseTemplate.tags.map((tag, index) => (
                <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Initial Scenario */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Initial Scenario</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-900 leading-relaxed">{caseTemplate.initialMessage}</p>
        </div>
      </Card>

      {/* What to Expect */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What to Expect</h2>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">1</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Problem Clarification</h3>
              <p className="text-gray-600 text-sm">Start by asking clarifying questions to understand the problem better.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">2</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Framework Development</h3>
              <p className="text-gray-600 text-sm">Develop a structured approach to analyze the problem systematically.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">3</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Analysis & Insights</h3>
              <p className="text-gray-600 text-sm">Work through your framework and develop key insights.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-600 font-semibold text-sm">4</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Recommendation</h3>
              <p className="text-gray-600 text-sm">Synthesize your analysis into clear, actionable recommendations.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tips for Success */}
      <Card className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tips for Success</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Structure Your Thinking</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use frameworks like profitability, market entry, or operations</li>
              <li>• Break down complex problems into manageable parts</li>
              <li>• Be hypothesis-driven in your approach</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium text-gray-900">Communication</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Think out loud and explain your reasoning</li>
              <li>• Ask clarifying questions when needed</li>
              <li>• Summarize key insights before moving forward</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Start Session */}
      <div className="text-center">
        <Button 
          size="lg" 
          onClick={handleStartCase}
          loading={startingSession}
          className="px-8"
        >
          Start Case Interview
        </Button>
        <p className="text-sm text-gray-500 mt-2">
          This will create a new practice session for this case
        </p>
      </div>
    </div>
  )
}
