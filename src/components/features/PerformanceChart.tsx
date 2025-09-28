'use client'

import React from 'react'
import { CircularProgress } from '@/components/ui/ProgressBar'
import Card from '@/components/ui/Card'

interface PerformanceMetric {
  label: string
  value: number
  max: number
  color: 'primary' | 'success' | 'warning' | 'error'
}

interface PerformanceChartProps {
  metrics: PerformanceMetric[]
  title?: string
}

export default function PerformanceChart({ metrics, title = 'Performance Overview' }: PerformanceChartProps) {
  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">{title}</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <CircularProgress
              value={metric.value}
              max={metric.max}
              color={metric.color}
              size={80}
              strokeWidth={6}
            />
            <p className="mt-2 text-sm font-medium text-gray-700">{metric.label}</p>
            <p className="text-xs text-gray-500">
              {metric.value}/{metric.max}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function SessionPerformanceChart({ 
  engagement, 
  structure, 
  communication, 
  overall 
}: {
  engagement: number
  structure: number
  communication: number
  overall: number
}) {
  const metrics: PerformanceMetric[] = [
    {
      label: 'Engagement',
      value: engagement,
      max: 100,
      color: 'primary'
    },
    {
      label: 'Structure',
      value: structure,
      max: 100,
      color: 'success'
    },
    {
      label: 'Communication',
      value: communication,
      max: 100,
      color: 'warning'
    },
    {
      label: 'Overall',
      value: overall,
      max: 100,
      color: overall >= 80 ? 'success' : overall >= 60 ? 'warning' : 'error'
    }
  ]

  return <PerformanceChart metrics={metrics} title="Session Performance" />
}
