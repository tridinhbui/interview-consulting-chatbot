'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { sessionsAPI } from '@/lib/api'
import { ISession, IMessage } from '@/types'
import ChatInterface from '@/components/chat/ChatInterface'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const sessionId = params.sessionId as string
  
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

  const handleCompleteSession = async () => {
    try {
      await sessionsAPI.updateSession(sessionId, { status: 'completed' })
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to complete session:', error)
    }
  }

  const handleAbandonSession = async () => {
    try {
      await sessionsAPI.updateSession(sessionId, { status: 'abandoned' })
      router.push('/dashboard')
    } catch (error) {
      console.error('Failed to abandon session:', error)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded-lg"></div>
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
            <Button onClick={() => router.push('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const caseTemplate = session.caseTemplateId as any

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Session Header */}
      <div className="mb-6">
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
          
          {session.status === 'active' && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleAbandonSession}>
                End Session
              </Button>
              <Button onClick={handleCompleteSession}>
                Complete
              </Button>
            </div>
          )}
        </div>
        
        {caseTemplate?.description && (
          <p className="mt-4 text-gray-600">{caseTemplate.description}</p>
        )}
      </div>

      {/* Chat Interface */}
      <Card padding="none" className="h-96">
        <ChatInterface
          sessionId={sessionId}
          initialMessages={messages}
          onNewMessage={(message) => setMessages(prev => [...prev, message])}
        />
      </Card>

      {/* Session Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Estimated Duration</p>
            <p className="text-lg font-semibold text-gray-900">{caseTemplate?.estimatedDuration} min</p>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Messages</p>
            <p className="text-lg font-semibold text-gray-900">{messages.filter(m => m.role !== 'system').length}</p>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-500">Score</p>
            <p className="text-lg font-semibold text-gray-900">
              {session.score ? `${session.score}%` : 'Pending'}
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
