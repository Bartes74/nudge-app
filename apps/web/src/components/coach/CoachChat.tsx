'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { CoachChatMessage } from './CoachChatMessage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  guardrail_flagged?: boolean
  created_at?: string
}

interface CoachChatProps {
  conversationId: string
  initialMessages: Message[]
  prefillMessage?: string
}

export function CoachChat({ conversationId, initialMessages, prefillMessage }: CoachChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState(prefillMessage ?? '')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  // Auto-send prefill on mount
  useEffect(() => {
    if (prefillMessage && initialMessages.length === 0) {
      void sendMessage(prefillMessage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || streaming) return

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMsg])
      setInput('')
      setStreaming(true)
      setStreamingText('')

      let accumulated = ''
      let guardrailModified = false
      let guardrailFinalText: string | null = null

      try {
        const res = await fetch(`/api/coach/conversations/${conversationId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: text.trim() }),
        })

        if (!res.ok || !res.body) throw new Error('Stream request failed')

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() ?? ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const raw = line.slice(6)
            try {
              const parsed = JSON.parse(raw) as {
                text?: string
                event?: string
                full_text?: string
                message?: string
              }

              if (parsed.text) {
                accumulated += parsed.text
                setStreamingText(accumulated)
              } else if (parsed.event === 'guardrail_modified' && parsed.full_text) {
                guardrailModified = true
                guardrailFinalText = parsed.full_text
                setStreamingText(parsed.full_text)
              } else if (parsed.event === 'done') {
                break
              } else if (parsed.event === 'error') {
                throw new Error(parsed.message ?? 'Stream error')
              }
            } catch {
              // Ignore malformed chunks
            }
          }
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Przepraszam, wystąpił błąd. Spróbuj ponownie.',
            created_at: new Date().toISOString(),
          },
        ])
        setStreaming(false)
        setStreamingText('')
        return
      }

      const finalContent = guardrailFinalText ?? accumulated
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: finalContent,
          guardrail_flagged: guardrailModified,
          created_at: new Date().toISOString(),
        },
      ])
      setStreaming(false)
      setStreamingText('')
      textareaRef.current?.focus()
    },
    [conversationId, streaming],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void sendMessage(input)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !streaming && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-muted-foreground">
            <p className="text-2xl">👋</p>
            <p className="text-sm">Cześć! O czym chcesz porozmawiać?</p>
            <p className="text-xs opacity-70">Możesz zapytać o technikę ćwiczeń, dietę lub plany treningowe.</p>
          </div>
        )}

        {messages.map((msg) => (
          <CoachChatMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            guardrailFlagged={msg.guardrail_flagged}
            createdAt={msg.created_at}
          />
        ))}

        {streaming && streamingText && (
          <CoachChatMessage role="assistant" content={streamingText} />
        )}

        {streaming && !streamingText && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Coach pisze…</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2 items-end bg-background">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Napisz wiadomość…"
          rows={1}
          className="min-h-[44px] max-h-32 resize-none"
          disabled={streaming}
        />
        <Button
          size="icon"
          onClick={() => void sendMessage(input)}
          disabled={!input.trim() || streaming}
          aria-label="Wyślij"
          className="shrink-0 h-11 w-11"
        >
          {streaming ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
