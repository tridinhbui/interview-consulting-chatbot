import React from 'react'
import Card from '@/components/ui/Card'
import { clsx } from 'clsx'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive: boolean
  }
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  className?: string
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
  className
}: StatsCardProps) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-green-100 text-green-600',
    warning: 'bg-yellow-100 text-yellow-600',
    error: 'bg-red-100 text-red-600',
    info: 'bg-blue-100 text-blue-600'
  }

  return (
    <Card className={clsx('relative overflow-hidden', className)}>
      <div className="flex items-center">
        {icon && (
          <div className={clsx('flex-shrink-0 p-3 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
        )}
        
        <div className={clsx('flex-1', icon && 'ml-4')}>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <div className={clsx(
            'flex items-center text-sm font-medium',
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          )}>
            {trend.isPositive ? (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
              </svg>
            )}
            {Math.abs(trend.value)}%
          </div>
          <span className="text-sm text-gray-500 ml-2">
            {trend.label}
          </span>
        </div>
      )}
    </Card>
  )
}

export function StatsGrid({ stats }: { stats: StatsCardProps[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatsCard key={index} {...stat} />
      ))}
    </div>
  )
}
