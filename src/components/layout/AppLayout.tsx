'use client'

import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { useAuth } from '@/lib/auth-context'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        {user && <Sidebar />}
        <main className={`flex-1 ${user ? 'lg:pl-64' : ''}`}>
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
