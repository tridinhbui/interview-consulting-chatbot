'use client'

import React, { useState, useRef, useEffect } from 'react'
import { IMessage } from '@/types'
import { messagesAPI } from '@/lib/api'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import MessageBubble from '@/components/chat/MessageBubble'

interface AdvancedChatInterfaceProps {
  sessionId: string
  initialMessages: IMessage[]
  onNewMessage?: (message: IMessage) => void
}

export default function AdvancedChatInterface({ 
  sessionId, 
  initialMessages, 
  onNewMessage 
}: AdvancedChatInterfaceProps) {
  const [messages, setMessages] = useState<IMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { addToast } = useToast()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`
    }
  }, [input])

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setIsTyping(true)

    try {
      const response = await messagesAPI.sendMessage({
        sessionId,
        content: userMessage
      })

      const newMessages = [response.userMessage, response.assistantMessage]
      setMessages(prev => [...prev, ...newMessages])
      
      if (onNewMessage) {
        newMessages.forEach(onNewMessage)
      }

      addToast({
        type: 'success',
        title: 'Message sent',
        duration: 2000
      })
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setInput(userMessage) // Restore message on error
      
      addToast({
        type: 'error',
        title: 'Failed to send message',
        message: error.response?.data?.error || 'Please try again',
        duration: 5000
      })
    } finally {
      setLoading(false)
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleQuickReply = (reply: string) => {
    setInput(reply)
    inputRef.current?.focus()
  }

  const quickReplies = [
    "Can you clarify the problem statement?",
    "What are the key constraints?",
    "Let me structure my approach...",
    "I'd like to explore the market dynamics",
    "What data would be helpful here?"
  ]

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((message) => (
          <MessageBubble key={message._id} message={message} />
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-900 max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-500">AI is analyzing your response...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Replies */}
      {!loading && messages.length > 2 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-white">
          <p className="text-xs text-gray-500 mb-2">Quick replies:</p>
          <div className="flex flex-wrap gap-2">
            {quickReplies.slice(0, 3).map((reply, index) => (
              <button
                key={index}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts and analysis..."
              className="w-full resize-none border border-gray-300 rounded-lg px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
              rows={1}
              disabled={loading}
            />
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {input.length}/2000
            </div>
          </div>
          
          <div className="flex flex-col space-y-1">
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || loading}
              loading={loading}
              size="sm"
              className="px-4"
            >
              Send
            </Button>
            
            {/* Voice input button (future feature) */}
            <button
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Voice input (coming soon)"
              disabled
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>{messages.filter(m => m.role === 'user').length} messages sent</span>
        </div>
      </div>
    </div>
  )
}
