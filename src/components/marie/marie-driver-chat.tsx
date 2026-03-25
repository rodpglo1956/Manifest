'use client'

import { useState } from 'react'
import { Sparkles, X, Send } from 'lucide-react'
import { useMarie } from './use-marie'
import { stripActionMarkers } from './marie-message'
import type { MarieMessage } from '@/types/marie'

function DriverMessage({ message }: { message: MarieMessage }) {
  const isUser = message.role === 'user'
  const displayText = isUser ? message.content : stripActionMarkers(message.content)

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
          isUser
            ? 'bg-[#EC008C] text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{displayText}</p>
      </div>
    </div>
  )
}

export function MarieDriverChat() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, isLoading, sendQuery } = useMarie()
  const [input, setInput] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    sendQuery(trimmed)
    setInput('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <>
      {/* Floating button - positioned above bottom nav */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-30 rounded-full bg-[#EC008C] p-3 text-white shadow-lg hover:bg-[#d4007e] transition-colors"
        aria-label="Open Marie AI assistant"
      >
        <Sparkles className="w-5 h-5" />
      </button>

      {/* Full-screen slide-up panel for mobile */}
      <div
        className={`fixed inset-0 z-50 bg-white flex flex-col transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Marie</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center px-8">
              Ask me about your loads and schedule
            </div>
          )}
          {messages.map((msg, i) => (
            <DriverMessage key={i} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-3">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-500 animate-pulse">
                Marie is thinking...
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 pb-safe">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Marie..."
              rows={1}
              className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#EC008C]/50 focus:border-[#EC008C]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-lg bg-[#EC008C] p-2 text-white hover:bg-[#d4007e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
