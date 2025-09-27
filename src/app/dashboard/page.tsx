'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { sessionsAPI, casesAPI } from '@/lib/api'
import { ISession, ICaseTemplate } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
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
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completedSessions}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
            </div>
          </div>
        </Card>
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      session.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'active'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {session.status}
                    </span>
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
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      caseTemplate.difficulty === 'beginner' 
                        ? 'bg-green-100 text-green-800'
                        : caseTemplate.difficulty === 'intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {caseTemplate.difficulty}
                    </span>
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
