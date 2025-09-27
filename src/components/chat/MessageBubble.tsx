'use client'

import React, { useState } from 'react'
import { IMessage } from '@/types'
import { format } from 'date-fns'
import Button from '@/components/ui/Button'

interface MessageBubbleProps {
  message: IMessage
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [showThinking, setShowThinking] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  const isUser = message.role === 'user'
  const hasMetadata = message.metadata && (message.metadata.thinking || message.metadata.suggestions?.length)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        {/* Main message bubble */}
        <div
          className={`px-4 py-2 rounded-lg ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-white border border-gray-200 text-gray-900'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          <p className={`text-xs mt-1 ${
            isUser ? 'text-primary-100' : 'text-gray-500'
          }`}>
            {format(new Date(message.timestamp), 'HH:mm')}
          </p>
        </div>

        {/* AI metadata (thinking & suggestions) */}
        {!isUser && hasMetadata && (
          <div className="mt-2 space-y-2">
            {/* Thinking process */}
            {message.metadata?.thinking && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-sm font-medium text-blue-800">
                    💭 AI Thinking Process
                  </span>
                  <svg
                    className={`w-4 h-4 text-blue-600 transform transition-transform ${
                      showThinking ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showThinking && (
                  <p className="mt-2 text-sm text-blue-700">
                    {message.metadata.thinking}
                  </p>
                )}
              </div>
            )}

            {/* Suggestions */}
            {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <button
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <span className="text-sm font-medium text-green-800">
                    💡 Suggestions
                  </span>
                  <svg
                    className={`w-4 h-4 text-green-600 transform transition-transform ${
                      showSuggestions ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showSuggestions && (
                  <ul className="mt-2 space-y-1">
                    {message.metadata.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-green-700 flex items-start">
                        <span className="mr-2">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className={`flex-shrink-0 ${isUser ? 'order-1 mr-2' : 'order-2 ml-2'}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
          isUser 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>
      </div>
    </div>
  )
}
