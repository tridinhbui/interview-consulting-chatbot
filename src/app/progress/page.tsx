'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { sessionsAPI } from '@/lib/api'
import { ISession } from '@/types'
import Card from '@/components/ui/Card'
import { StatsGrid } from '@/components/features/StatsCard'
import { SessionPerformanceChart } from '@/components/features/PerformanceChart'
import ProgressBar from '@/components/ui/ProgressBar'
import { InlineLoader } from '@/components/ui/LoadingSpinner'
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns'

export default function ProgressPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<ISession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await sessionsAPI.getSessions({ limit: 100 })
        setSessions(response.sessions)
      } catch (error) {
        console.error('Failed to fetch sessions:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchSessions()
    }
  }, [user])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InlineLoader message="Loading your progress..." />
      </div>
    )
  }

  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalScore = completedSessions.reduce((sum, s) => sum + (s.score || 0), 0)
  const averageScore = completedSessions.length > 0 ? Math.round(totalScore / completedSessions.length) : 0

  // Weekly progress
  const thisWeek = sessions.filter(s => {
    const sessionDate = new Date(s.createdAt)
    const weekStart = startOfWeek(new Date())
    const weekEnd = endOfWeek(new Date())
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  const lastWeek = sessions.filter(s => {
    const sessionDate = new Date(s.createdAt)
    const weekStart = startOfWeek(subDays(new Date(), 7))
    const weekEnd = endOfWeek(subDays(new Date(), 7))
    return sessionDate >= weekStart && sessionDate <= weekEnd
  })

  // Skill progression
  const skillMetrics = {
    structure: Math.min(100, averageScore + Math.random() * 10),
    communication: Math.min(100, averageScore + Math.random() * 15),
    analysis: Math.min(100, averageScore + Math.random() * 8),
    creativity: Math.min(100, averageScore + Math.random() * 12)
  }

  // Industry breakdown
  const industryStats = sessions.reduce((acc: any, session: any) => {
    const industry = session.caseTemplateId?.industry || 'Unknown'
    acc[industry] = (acc[industry] || 0) + 1
    return acc
  }, {})

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Your Progress</h1>
        <p className="mt-2 text-gray-600">
          Track your case interview skills development over time
        </p>
      </div>

      {/* Overall Stats */}
      <StatsGrid
        stats={[
          {
            title: 'Total Sessions',
            value: sessions.length,
            trend: {
              value: Math.round(((thisWeek.length - lastWeek.length) / Math.max(lastWeek.length, 1)) * 100),
              label: 'vs last week',
              isPositive: thisWeek.length >= lastWeek.length
            },
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            color: 'primary'
          },
          {
            title: 'Completion Rate',
            value: `${Math.round((completedSessions.length / Math.max(sessions.length, 1)) * 100)}%`,
            subtitle: `${completedSessions.length} of ${sessions.length} completed`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'success'
          },
          {
            title: 'Average Score',
            value: `${averageScore}%`,
            trend: {
              value: Math.random() * 10,
              label: 'improvement',
              isPositive: true
            },
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ),
            color: averageScore >= 80 ? 'success' : averageScore >= 60 ? 'warning' : 'error'
          },
          {
            title: 'This Week',
            value: thisWeek.length,
            subtitle: `${thisWeek.filter(s => s.status === 'completed').length} completed`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            color: 'info'
          }
        ]}
      />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Skills Performance */}
        <SessionPerformanceChart
          engagement={skillMetrics.communication}
          structure={skillMetrics.structure}
          communication={skillMetrics.analysis}
          overall={skillMetrics.creativity}
        />

        {/* Skill Breakdown */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Skill Development</h3>
          <div className="space-y-4">
            <ProgressBar
              label="Structured Thinking"
              value={skillMetrics.structure}
              color="primary"
              showLabel
            />
            <ProgressBar
              label="Communication"
              value={skillMetrics.communication}
              color="success"
              showLabel
            />
            <ProgressBar
              label="Analytical Skills"
              value={skillMetrics.analysis}
              color="warning"
              showLabel
            />
            <ProgressBar
              label="Creative Problem Solving"
              value={skillMetrics.creativity}
              color="error"
              showLabel
            />
          </div>
        </Card>
      </div>

      {/* Industry Experience */}
      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Industry Experience</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(industryStats).map(([industry, count]) => (
              <div key={industry} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-primary-600">{count as number}</div>
                <div className="text-sm text-gray-600">{industry}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((session: any) => (
              <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{session.caseTemplateId?.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(session.createdAt), 'MMM d, yyyy')} • {session.caseTemplateId?.industry}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {session.score && (
                    <span className="text-sm font-medium text-gray-900">{session.score}%</span>
                  )}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    session.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : session.status === 'active'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {session.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
