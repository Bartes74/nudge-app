'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export function GenerateNutritionButton() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'polling'>('idle')

  async function handleGenerate() {
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
      pollTask(task_id)
    } catch {
      toast.error('Wystąpił błąd')
      setState('idle')
    }
  }

  function pollTask(taskId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/plan/training/tasks/${taskId}`)
        const task = (await res.json()) as { status?: string; error?: string }
        if (task.status === 'completed') {
          clearInterval(interval)
          router.refresh()
          setState('idle')
        } else if (task.status === 'failed' || task.status === 'cancelled') {
          clearInterval(interval)
          toast.error(task.error ?? 'Nie udało się wygenerować planu')
          setState('idle')
        }
      } catch {
        clearInterval(interval)
        setState('idle')
      }
    }, 2000)
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
