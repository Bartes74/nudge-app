'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AskCoachButtonProps {
  entryPoint: 'exercise_shortcut' | 'meal_shortcut'
  contextEntityType: 'exercise' | 'meal'
  contextEntityId: string
  prefillMessage?: string
  label?: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost'
}

export function AskCoachButton({
  entryPoint,
  contextEntityType,
  contextEntityId,
  prefillMessage,
  label = 'Spytaj coacha',
  variant = 'outline',
}: AskCoachButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/coach/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_point: entryPoint,
          context_entity_type: contextEntityType,
          context_entity_id: contextEntityId,
        }),
      })
      const data = await res.json() as { conversation?: { id: string } }
      if (data.conversation?.id) {
        const url = prefillMessage
          ? `/app/coach/${data.conversation.id}?prefill=${encodeURIComponent(prefillMessage)}`
          : `/app/coach/${data.conversation.id}`
        router.push(url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
