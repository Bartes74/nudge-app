'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { startAiTaskPolling } from '@/lib/aiTasks'

export function GenerateNutritionButton() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'polling'>('idle')
  const stopPollingRef = useRef<(() => void) | null>(null)

  useEffect(() => () => {
    stopPollingRef.current?.()
  }, [])

  async function handleGenerate() {
    stopPollingRef.current?.()
    setState('loading')
    try {
      const res = await fetch('/api/plan/nutrition/generate', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? 'Błąd generowania planu')
        setState('idle')
        return
      }
      const { task_id } = await res.json()
      setState('polling')
      stopPollingRef.current = startAiTaskPolling(task_id, {
        onCompleted: () => {
          router.refresh()
          setState('idle')
        },
        onFailed: (message) => {
          toast.error(message)
          setState('idle')
        },
        onRequestError: (message) => {
          toast.error(message)
          setState('idle')
        },
      })
    } catch {
      toast.error('Wystąpił błąd')
      setState('idle')
    }
  }

  const label =
    state === 'loading'
      ? 'Uruchamianie…'
      : state === 'polling'
        ? 'Generowanie planu…'
        : 'Wygeneruj plan żywieniowy'

  return (
    <Button
      onClick={handleGenerate}
      disabled={state !== 'idle'}
      isLoading={state !== 'idle'}
      size="hero"
      className="w-full gap-2"
    >
      {state === 'idle' && <Sparkles className="h-4 w-4" />}
      {label}
    </Button>
  )
}
