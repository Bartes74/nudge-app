'use client'

import { useState, useCallback } from 'react'

type TaskStatus = 'idle' | 'generating' | 'completed' | 'failed' | 'blocked'

interface GenerateState {
  status: TaskStatus
  taskId: string | null
  error: string | null
  blockedReasons: string[] | null
}

export function useGeneratePlan(onComplete: () => void) {
  const [state, setState] = useState<GenerateState>({
    status: 'idle',
    taskId: null,
    error: null,
    blockedReasons: null,
  })

  const generate = useCallback(async () => {
    setState({ status: 'generating', taskId: null, error: null, blockedReasons: null })

    const res = await fetch('/api/plan/training/generate', { method: 'POST' })
    const json = await res.json() as { task_id?: string; error?: string; flags?: string[] }

    if (res.status === 422) {
      setState({ status: 'blocked', taskId: null, error: null, blockedReasons: json.flags ?? [] })
      return
    }

    if (!res.ok || !json.task_id) {
      setState({ status: 'failed', taskId: null, error: json.error ?? 'Nieznany błąd', blockedReasons: null })
      return
    }

    const taskId = json.task_id
    setState((s) => ({ ...s, taskId }))

    // Poll for completion
    const poll = setInterval(async () => {
      const taskRes = await fetch(`/api/plan/training/tasks/${taskId}`)
      const task = await taskRes.json() as { status: string; error?: string }

      if (task.status === 'completed') {
        clearInterval(poll)
        setState({ status: 'completed', taskId, error: null, blockedReasons: null })
        onComplete()
      } else if (task.status === 'failed' || task.status === 'cancelled') {
        clearInterval(poll)
        setState({ status: 'failed', taskId, error: task.error ?? 'Generacja nie powiodła się', blockedReasons: null })
      }
    }, 2000)
  }, [onComplete])

  return { ...state, generate }
}
