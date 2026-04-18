'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { startAiTaskPolling } from '@/lib/aiTasks'

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
  const stopPollingRef = useRef<(() => void) | null>(null)

  useEffect(() => () => {
    stopPollingRef.current?.()
  }, [])

  const generate = useCallback(async () => {
    stopPollingRef.current?.()
    setState({ status: 'generating', taskId: null, error: null, blockedReasons: null })

    try {
      const res = await fetch('/api/plan/training/generate', { method: 'POST' })
      const json = (await res.json()) as { task_id?: string; error?: string; flags?: string[] }

      if (res.status === 422) {
        setState({ status: 'blocked', taskId: null, error: null, blockedReasons: json.flags ?? [] })
        return
      }

      if (!res.ok || !json.task_id) {
        setState({
          status: 'failed',
          taskId: null,
          error: json.error ?? 'Nie udało się uruchomić generowania planu.',
          blockedReasons: null,
        })
        return
      }

      const taskId = json.task_id
      setState((s) => ({ ...s, taskId }))

      stopPollingRef.current = startAiTaskPolling(taskId, {
        onCompleted: () => {
          setState({ status: 'completed', taskId, error: null, blockedReasons: null })
          onComplete()
        },
        onFailed: (message) => {
          setState({ status: 'failed', taskId, error: message, blockedReasons: null })
        },
        onRequestError: (message) => {
          setState({ status: 'failed', taskId, error: message, blockedReasons: null })
        },
      })
    } catch {
      setState({
        status: 'failed',
        taskId: null,
        error: 'Wystąpił błąd połączenia. Spróbuj ponownie.',
        blockedReasons: null,
      })
    }
  }, [onComplete])

  return { ...state, generate }
}
