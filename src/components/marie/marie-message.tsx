'use client'

import { useRouter } from 'next/navigation'
import type { MarieMessage, ActionButton } from '@/types/marie'

const ACTION_REGEX = /\[ACTION:(\w+):([^:]+):([^\]]+)\]/g

export function parseActions(text: string): { cleanText: string; actions: ActionButton[] } {
  const actions: ActionButton[] = []
  const cleanText = text.replace(ACTION_REGEX, (_, type, entityId, label) => {
    actions.push({ type: type as ActionButton['type'], entityId, label })
    return ''
  })
  return { cleanText: cleanText.trim(), actions }
}

export function stripActionMarkers(text: string): string {
  return text.replace(ACTION_REGEX, '').trim()
}

export function MarieMessage({ message }: { message: MarieMessage }) {
  const router = useRouter()
  const isUser = message.role === 'user'

  const { cleanText, actions } = isUser
    ? { cleanText: message.content, actions: [] }
    : parseActions(message.content)

  function handleAction(action: ActionButton) {
    switch (action.type) {
      case 'view_load':
        router.push(`/loads/${action.entityId}`)
        break
      case 'dispatch_driver':
        router.push('/dispatch')
        break
      case 'generate_invoice':
        router.push(`/invoices?generate=${action.entityId}`)
        break
    }
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
          isUser
            ? 'bg-[#EC008C] text-white'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        <p className="whitespace-pre-wrap">{cleanText}</p>
        {actions.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={() => handleAction(action)}
                className="inline-flex items-center rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-[#EC008C] shadow-sm hover:bg-white transition-colors border border-[#EC008C]/20"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
