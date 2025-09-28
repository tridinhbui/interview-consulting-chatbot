'use client'

import React, { useState } from 'react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

interface FilterOption {
  value: string
  label: string
}

interface SearchAndFilterProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filters: {
    label: string
    key: string
    options: FilterOption[]
    value: string
    onChange: (value: string) => void
  }[]
  onClearFilters: () => void
  showClearButton?: boolean
}

export default function SearchAndFilter({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  filters,
  onClearFilters,
  showClearButton = true
}: SearchAndFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const hasActiveFilters = filters.some(filter => filter.value !== '')

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {filters.filter(f => f.value !== '').length}
            </span>
          )}
        </Button>
      </div>

      {/* Filter Panel */}
      {isExpanded && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                <select
                  value={filter.value}
                  onChange={(e) => filter.onChange(e.target.value)}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="">All {filter.label}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          {showClearButton && hasActiveFilters && (
            <div className="mt-4 flex justify-end">
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function QuickFilters({ 
  options, 
  activeFilter, 
  onFilterChange 
}: {
  options: FilterOption[]
  activeFilter: string
  onFilterChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onFilterChange('')}
        className={`px-3 py-1 text-sm rounded-full transition-colors ${
          activeFilter === ''
            ? 'bg-primary-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onFilterChange(option.value)}
          className={`px-3 py-1 text-sm rounded-full transition-colors ${
            activeFilter === option.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
