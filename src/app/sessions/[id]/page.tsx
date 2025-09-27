'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { sessionsAPI } from '@/lib/api'
import { ISession, IMessage } from '@/types'
import SessionSummary from '@/components/chat/SessionSummary'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function SessionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const sessionId = params.id as string
  
  const [session, setSession] = useState<ISession | null>(null)
  const [messages, setMessages] = useState<IMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await sessionsAPI.getSession(sessionId)
        setSession(response.session)
        setMessages(response.messages)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    if (user && sessionId) {
      fetchSession()
    }
  }, [user, sessionId])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Not Found</h2>
            <p className="text-gray-600 mb-4">{error || 'The session you are looking for does not exist.'}</p>
            <div className="space-x-2">
              <Button onClick={() => router.push('/sessions')}>
                Back to Sessions
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Dashboard
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  const caseTemplate = session.caseTemplateId as any

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{caseTemplate?.title}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-sm text-gray-500">{caseTemplate?.industry}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                caseTemplate?.difficulty === 'beginner' 
                  ? 'bg-green-100 text-green-800'
                  : caseTemplate?.difficulty === 'intermediate'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {caseTemplate?.difficulty}
              </span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                session.status === 'active' 
                  ? 'bg-blue-100 text-blue-800'
                  : session.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {session.status}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.push('/sessions')}>
              Back to Sessions
            </Button>
            
            {session.status === 'active' && (
              <Button onClick={() => router.push(`/chat/${session._id}`)}>
                Continue Session
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Session Summary */}
      <SessionSummary session={session} messages={messages} />

      {/* Action Buttons */}
      <div className="mt-8 flex justify-center space-x-4">
        <Button variant="outline" onClick={() => router.push('/cases')}>
          Browse More Cases
        </Button>
        
        {session.status === 'completed' && (
          <Button onClick={() => {
            // Create a new session with the same case template
            router.push(`/cases/${caseTemplate._id}`)
          }}>
            Practice Again
          </Button>
        )}
      </div>
    </div>
  )
}
