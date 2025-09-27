'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { casesAPI, sessionsAPI } from '@/lib/api'
import { ICaseTemplate } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function CasesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [cases, setCases] = useState<ICaseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [startingSession, setStartingSession] = useState<string | null>(null)

  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Consulting']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const params: any = {}
        if (selectedIndustry) params.industry = selectedIndustry
        if (selectedDifficulty) params.difficulty = selectedDifficulty
        
        const response = await casesAPI.getCases(params)
        setCases(response.cases)
      } catch (error) {
        console.error('Failed to fetch cases:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchCases()
    }
  }, [user, selectedIndustry, selectedDifficulty])

  const filteredCases = cases.filter(caseTemplate =>
    caseTemplate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caseTemplate.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleStartCase = async (caseId: string) => {
    setStartingSession(caseId)
    try {
      const response = await sessionsAPI.createSession({ caseTemplateId: caseId })
      router.push(`/chat/${response.session._id}`)
    } catch (error) {
      console.error('Failed to start session:', error)
    } finally {
      setStartingSession(null)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Case Library</h1>
        <p className="mt-2 text-gray-600">
          Choose from our collection of case interview scenarios
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder="Search cases..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="input-field"
        >
          <option value="">All Industries</option>
          {industries.map(industry => (
            <option key={industry} value={industry}>{industry}</option>
          ))}
        </select>
        
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="input-field"
        >
          <option value="">All Difficulties</option>
          {difficulties.map(difficulty => (
            <option key={difficulty} value={difficulty}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </option>
          ))}
        </select>
        
        <Button variant="outline" onClick={() => {
          setSearchTerm('')
          setSelectedIndustry('')
          setSelectedDifficulty('')
        }}>
          Clear Filters
        </Button>
      </div>

      {/* Cases Grid */}
      {filteredCases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((caseTemplate) => (
            <Card key={caseTemplate._id}>
              <div className="flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      caseTemplate.difficulty === 'beginner' 
                        ? 'bg-green-100 text-green-800'
                        : caseTemplate.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {caseTemplate.difficulty}
                    </span>
                    <span className="text-xs text-gray-500">
                      {caseTemplate.estimatedDuration} min
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {caseTemplate.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {caseTemplate.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>{caseTemplate.industry}</span>
                    {caseTemplate.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {caseTemplate.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                            {tag}
                          </span>
                        ))}
                        {caseTemplate.tags.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{caseTemplate.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/cases/${caseTemplate._id}`)}
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={startingSession === caseTemplate._id}
                    onClick={() => handleStartCase(caseTemplate._id)}
                  >
                    Start Case
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No cases found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
