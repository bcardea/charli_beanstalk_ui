'use client'

import { useState } from 'react'
import { useLocation } from '@/contexts/LocationContext'
import FormattedMessage from '@/components/chat/FormattedMessage'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatArea({ userName }: { userName: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: userName !== 'Guest' 
        ? `Welcome to ${userName}! How can I assist you with your business today?`
        : 'Hey! How can I help?',
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { locationId } = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setIsLoading(true)
    setError(null)

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          locationId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message')
      }

      // Add assistant's response
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch (error: any) {
      console.error('Error in chat:', error)
      setError(error.message || 'Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="chat-container flex-1 flex flex-col overflow-hidden p-6">
        {/* Chat Header */}
        <div className="chat-header flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[--primary] animate-pulse" />
            <h2 className="text-lg">
              <span className="font-light">Quick Chat with </span>
              <span className="font-bold">Charli</span>
            </h2>
          </div>
        </div>

        {/* Messages Area */}
        <div className="chat-messages flex-1 overflow-y-auto">
          <div className="space-y-2">
            {messages.map((message, index) => (
              <FormattedMessage
                key={index}
                role={message.role}
                content={message.content}
              />
            ))}
          </div>
          
          {isLoading && (
            <div className="loading-dots">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="chat-input-container mt-6">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="chat-input"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="chat-send-button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
                </svg>
                <span>Send</span>
              </button>
            </div>
            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
