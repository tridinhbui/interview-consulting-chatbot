import React from 'react'
import { clsx } from 'clsx'

interface ProgressBarProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  label?: string
  className?: string
}

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showLabel = false,
  label,
  className
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }

  const colorClasses = {
    primary: 'bg-primary-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600'
  }

  return (
    <div className={clsx('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            {label || `${Math.round(percentage)}%`}
          </span>
          {showLabel && !label && (
            <span className="text-sm text-gray-500">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div className={clsx('w-full bg-gray-200 rounded-full', sizeClasses[size])}>
        <div
          className={clsx('rounded-full transition-all duration-300 ease-out', colorClasses[color], sizeClasses[size])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 80, 
  strokeWidth = 8,
  color = 'primary',
  showLabel = true
}: {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: 'primary' | 'success' | 'warning' | 'error'
  showLabel?: boolean
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const colorClasses = {
    primary: 'stroke-primary-600',
    success: 'stroke-green-600',
    warning: 'stroke-yellow-600',
    error: 'stroke-red-600'
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={clsx('transition-all duration-300 ease-out', colorClasses[color])}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-gray-700">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}
