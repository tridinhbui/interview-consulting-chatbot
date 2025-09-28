import React from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  
  const variantClasses = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const variantMap = {
    beginner: 'success' as const,
    intermediate: 'warning' as const,
    advanced: 'error' as const
  }

  return (
    <Badge variant={variantMap[difficulty as keyof typeof variantMap] || 'default'}>
      {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const variantMap = {
    active: 'info' as const,
    completed: 'success' as const,
    abandoned: 'default' as const
  }

  return (
    <Badge variant={variantMap[status as keyof typeof variantMap] || 'default'}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}
