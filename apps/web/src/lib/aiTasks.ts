'use client'

export type AiTaskStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type AiTaskSnapshot = {
  status: AiTaskStatus
  error?: string | null
}

type PollCallbacks = {
  intervalMs?: number
  onCompleted: (task: AiTaskSnapshot) => void
  onFailed: (message: string) => void
  onRequestError: (message: string) => void
}

function toRequestErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.length > 0) return error
  return 'Nie udało się sprawdzić statusu zadania. Spróbuj ponownie.'
}

export function startAiTaskPolling(
  taskId: string,
  {
    intervalMs = 2000,
    onCompleted,
    onFailed,
    onRequestError,
  }: PollCallbacks,
): () => void {
  let stopped = false

  const stop = () => {
    stopped = true
    window.clearInterval(intervalId)
  }

  const tick = async () => {
    try {
      const response = await fetch(`/api/ai-tasks/${taskId}`, { cache: 'no-store' })
      const body = (await response.json().catch(() => ({}))) as
        | AiTaskSnapshot
        | { error?: unknown }

      if (!response.ok) {
        stop()
        onRequestError(toRequestErrorMessage('error' in body ? body.error : undefined))
        return
      }

      const task = body as AiTaskSnapshot
      if (task.status === 'completed') {
        stop()
        onCompleted(task)
        return
      }

      if (task.status === 'failed' || task.status === 'cancelled') {
        stop()
        onFailed(task.error ?? 'Nie udało się zakończyć zadania.')
      }
    } catch {
      stop()
      onRequestError('Wystąpił błąd połączenia. Spróbuj ponownie.')
    }
  }

  const intervalId = window.setInterval(() => {
    if (stopped) return
    void tick()
  }, intervalMs)

  void tick()

  return stop
}
