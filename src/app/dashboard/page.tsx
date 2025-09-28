'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sessionsAPI, casesAPI } from '@/lib/api'
import { ISession, ICaseTemplate } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { StatsGrid } from '@/components/features/StatsCard'
import { SessionPerformanceChart } from '@/components/features/PerformanceChart'
import { InlineLoader } from '@/components/ui/LoadingSpinner'
import { StatusBadge, DifficultyBadge } from '@/components/ui/Badge'
import { format } from 'date-fns'

export default function DashboardPage() {
  const { user } = useAuth()
  const [recentSessions, setRecentSessions] = useState<ISession[]>([])
  const [popularCases, setPopularCases] = useState<ICaseTemplate[]>([])
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch recent sessions
        const sessionsResponse = await sessionsAPI.getSessions({ limit: 5 })
        setRecentSessions(sessionsResponse.sessions)
        
        // Calculate stats
        const allSessions = sessionsResponse.sessions
        const completed = allSessions.filter((s: ISession) => s.status === 'completed')
        const avgScore = completed.length > 0 
          ? completed.reduce((sum: number, s: ISession) => sum + (s.score || 0), 0) / completed.length
          : 0
        
        setStats({
          totalSessions: allSessions.length,
          completedSessions: completed.length,
          averageScore: Math.round(avgScore)
        })
        
        // Fetch popular cases
        const casesResponse = await casesAPI.getCases({ limit: 6 })
        setPopularCases(casesResponse.cases)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InlineLoader message="Loading your dashboard..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="mt-2 text-gray-600">
          Here's your case interview progress overview
        </p>
      </div>

      {/* Stats Cards */}
      <StatsGrid
        stats={[
          {
            title: 'Total Sessions',
            value: stats.totalSessions,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            ),
            color: 'primary'
          },
          {
            title: 'Completed',
            value: stats.completedSessions,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'success'
          },
          {
            title: 'Average Score',
            value: `${stats.averageScore}%`,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ),
            color: stats.averageScore >= 80 ? 'success' : stats.averageScore >= 60 ? 'warning' : 'error'
          },
          {
            title: 'This Week',
            value: recentSessions.filter(s => {
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return new Date(s.createdAt) > weekAgo
            }).length,
            icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
            color: 'info'
          }
        ]}
      />

      {/* Performance Chart */}
      <div className="mb-8">
        <SessionPerformanceChart
          engagement={Math.min(100, (stats.totalSessions / 10) * 100)}
          structure={stats.averageScore}
          communication={Math.min(100, (recentSessions.reduce((sum, s: any) => sum + (s.caseTemplateId?.estimatedDuration || 30), 0) / Math.max(recentSessions.length, 1) / 60) * 100)}
          overall={stats.averageScore}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Sessions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
            <Link href="/sessions">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </div>
          
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session: any) => (
                <div key={session._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{session.caseTemplateId?.title}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(session.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={session.status} />
                    {session.status === 'active' && (
                      <Link href={`/chat/${session._id}`}>
                        <Button size="sm">Continue</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No sessions yet. Start your first case interview!
            </p>
          )}
        </Card>

        {/* Popular Cases */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Popular Cases</h2>
            <Link href="/cases">
              <Button variant="ghost" size="sm">Browse all</Button>
            </Link>
          </div>
          
          <div className="space-y-3">
            {popularCases.slice(0, 5).map((caseTemplate: ICaseTemplate) => (
              <div key={caseTemplate._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{caseTemplate.title}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{caseTemplate.industry}</span>
                    <DifficultyBadge difficulty={caseTemplate.difficulty} />
                  </div>
                </div>
                <Link href={`/cases/${caseTemplate._id}`}>
                  <Button size="sm" variant="outline">Start</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 text-center">
        <Link href="/cases">
          <Button size="lg">
            Start New Case Interview
          </Button>
        </Link>
      </div>
    </div>
  )
}
