import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import { ToastProvider } from '@/components/ui/Toast'
import AppLayout from '@/components/layout/AppLayout'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Ceasey - Case Interview Coaching',
  description: 'AI-powered case interview coaching platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <AuthProvider>
            <AppLayout>
              {children}
            </AppLayout>
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
