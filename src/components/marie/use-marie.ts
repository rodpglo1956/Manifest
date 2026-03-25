'use client'

import { useState, useCallback } from 'react'
import type { MarieMessage, MarieQueryResponse } from '@/types/marie'

export function useMarie() {
  const [messages, setMessages] = useState<MarieMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sendQuery = useCallback(async (query: string) => {
    const userMessage: MarieMessage = { role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      const res = await fetch('/api/marie/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }

      const data: MarieQueryResponse = await res.json()
      const assistantMessage: MarieMessage = { role: 'assistant', content: data.response }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      const errorMessage: MarieMessage = {
        role: 'assistant',
        content: 'Sorry, I ran into an issue. Try again in a moment.',
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return { messages, isLoading, sendQuery, clearMessages }
}
