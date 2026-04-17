'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CoachChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  guardrailFlagged?: boolean
  createdAt?: string
}

export function CoachChatMessage({
  role,
  content,
  guardrailFlagged,
  createdAt,
}: CoachChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex gap-2', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white text-xs font-bold mt-1">
          AI
        </div>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'rounded-tr-sm bg-brand text-white'
            : 'rounded-tl-sm bg-muted text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap">{content}</p>
        {guardrailFlagged && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            <span>Odpowiedź zmodyfikowana przez guardrails</span>
          </div>
        )}
        {createdAt && (
          <p className={cn('mt-1 text-xs opacity-60', isUser ? 'text-right' : 'text-left')}>
            {new Date(createdAt).toLocaleTimeString('pl-PL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>
    </div>
  )
}
