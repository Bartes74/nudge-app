'use client'

import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function CoachBubble() {
  const router = useRouter()

  async function openCoach() {
    try {
      const res = await fetch('/api/coach/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_point: 'global_bubble' }),
      })
      const data = await res.json() as { conversation?: { id: string } }
      if (data.conversation?.id) {
        router.push(`/app/coach/${data.conversation.id}`)
      }
    } catch {
      router.push('/app/coach')
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={openCoach}
            aria-label="Otwórz chat z coachem"
            className="fixed bottom-[calc(var(--bottom-nav-height)+1rem)] right-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-lg ring-2 ring-brand/20 transition-all hover:bg-brand/90 active:scale-95 select-none"
          >
            <MessageCircle className="h-6 w-6" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left">Coach AI</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
