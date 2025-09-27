'use client'

import React from 'react'
import { ISession, IMessage } from '@/types'
import Card from '@/components/ui/Card'
import { format } from 'date-fns'

interface SessionSummaryProps {
  session: ISession
  messages: IMessage[]
}

export default function SessionSummary({ session, messages }: SessionSummaryProps) {
  const userMessages = messages.filter(m => m.role === 'user')
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const duration = session.completedAt 
    ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / (1000 * 60))
    : null

  const caseTemplate = session.caseTemplateId as any

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Session Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary-600">{session.score || 'N/A'}</p>
            <p className="text-sm text-gray-500">Score</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{userMessages.length}</p>
            <p className="text-sm text-gray-500">Your Messages</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{duration || 'N/A'}</p>
            <p className="text-sm text-gray-500">Minutes</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {Math.round(userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0) / Math.max(userMessages.length, 1))}
            </p>
            <p className="text-sm text-gray-500">Avg Words</p>
          </div>
        </div>
      </Card>

      {/* Case Information */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Case Details</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Title:</span>
            <span className="font-medium">{caseTemplate?.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Industry:</span>
            <span className="font-medium">{caseTemplate?.industry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Difficulty:</span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              caseTemplate?.difficulty === 'beginner' 
                ? 'bg-green-100 text-green-800'
                : caseTemplate?.difficulty === 'intermediate'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {caseTemplate?.difficulty}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Started:</span>
            <span className="font-medium">{format(new Date(session.startedAt), 'MMM d, yyyy HH:mm')}</span>
          </div>
          {session.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Completed:</span>
              <span className="font-medium">{format(new Date(session.completedAt), 'MMM d, yyyy HH:mm')}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Feedback */}
      {session.feedback && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Feedback</h3>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700">{session.feedback}</div>
          </div>
        </Card>
      )}

      {/* Performance Insights */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Insights</h3>
        <div className="space-y-4">
          {/* Engagement Level */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Engagement Level</span>
              <span className="text-sm text-gray-500">
                {userMessages.length >= 8 ? 'High' : userMessages.length >= 5 ? 'Medium' : 'Low'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full" 
                style={{ width: `${Math.min(100, (userMessages.length / 10) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Response Quality */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Response Quality</span>
              <span className="text-sm text-gray-500">
                {userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0) / Math.max(userMessages.length, 1) >= 30 ? 'Detailed' : 'Concise'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ 
                  width: `${Math.min(100, (userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0) / Math.max(userMessages.length, 1) / 50) * 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Structure Score */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Structured Thinking</span>
              <span className="text-sm text-gray-500">
                {session.score && session.score >= 70 ? 'Strong' : session.score && session.score >= 50 ? 'Good' : 'Developing'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ width: `${session.score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </Card>

      {/* Conversation Highlights */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Insights</h3>
        <div className="space-y-3">
          {assistantMessages
            .filter(m => m.metadata?.suggestions && m.metadata.suggestions.length > 0)
            .slice(-3)
            .map((message, index) => (
              <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">AI Suggestions:</p>
                <ul className="text-sm text-blue-700 space-y-1">
                  {message.metadata?.suggestions?.map((suggestion, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}
