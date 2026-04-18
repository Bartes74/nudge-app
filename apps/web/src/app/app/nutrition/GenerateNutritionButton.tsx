'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles } from 'lucide-react'

export function GenerateNutritionButton() {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'loading' | 'polling'>('idle')

  async function handleGenerate() {
    setState('loading')
    try {
      const res = await fetch('/api/plan/nutrition/generate', { method: 'POST' })
      if (!res.ok) {
        const body = await res.json()
        alert(body.error ?? 'Błąd generowania planu')
        setState('idle')
        return
      }
      const { task_id } = await res.json()
      setState('polling')
      pollTask(task_id)
    } catch {
      setState('idle')
    }
  }

  function pollTask(taskId: string) {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/plan/training/tasks/${taskId}`)
        const body = await res.json()
        if (body.task?.status === 'completed') {
          clearInterval(interval)
          router.refresh()
          setState('idle')
        } else if (body.task?.status === 'failed' || body.task?.status === 'cancelled') {
          clearInterval(interval)
          alert(body.task.error ?? 'Nie udało się wygenerować planu')
          setState('idle')
        }
      } catch {
        clearInterval(interval)
        setState('idle')
      }
    }, 2000)
  }

  return (
    <Button onClick={handleGenerate} disabled={state !== 'idle'} className="w-full gap-2">
      {state !== 'idle' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {state === 'idle' && 'Wygeneruj plan żywieniowy'}
      {state === 'loading' && 'Uruchamianie...'}
      {state === 'polling' && 'Generowanie planu...'}
    </Button>
  )
}
