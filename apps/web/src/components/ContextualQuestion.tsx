'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: string
  fieldKey: string
  text: string
  answerType: string
  answerOptions: {
    options?: Array<{ value: string | number; label: string }>
    min?: number
    max?: number
    step?: number
    unit?: string
    placeholder?: string
    labels?: Record<string, string>
  } | null
  whyWeAsk: string
}

interface Props {
  context?: string
}

// Module-level flag — max 1 question per session (anti-spam rule)
let shownThisSession = false

export function ContextualQuestion({ context }: Props) {
  const [question, setQuestion] = useState<Question | null>(null)
  const [visible, setVisible] = useState(false)
  const [answer, setAnswer] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (shownThisSession) return

    fetch('/api/questions/next')
      .then((r) => r.json())
      .then((data: { questions: Question[] }) => {
        const q = data.questions?.[0]
        if (q) {
          shownThisSession = true
          setQuestion(q)
          // Delay appearance so it doesn't feel jarring
          setTimeout(() => setVisible(true), 1500)
        }
      })
      .catch(() => {/* silently ignore */})
  }, [])

  const dismiss = () => {
    setVisible(false)
    if (question) {
      void fetch(`/api/questions/${question.id}/skip`, { method: 'POST' })
    }
  }

  const submit = async () => {
    if (!question || !answer) return
    setSubmitting(true)
    try {
      const payload: Record<string, unknown> = {
        context: context ?? 'contextual',
        source: 'contextual',
      }

      const numericTypes = ['numeric', 'scale']
      if (numericTypes.includes(question.answerType)) {
        payload['answer_numeric'] = Number(answer)
      } else if (question.answerType === 'boolean') {
        payload['answer_json'] = answer === 'true'
      } else if (question.answerType === 'multi_select') {
        payload['answer_json'] = answer.split(',').filter(Boolean)
      } else {
        payload['answer_text'] = answer
      }

      const res = await fetch(`/api/questions/${question.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      toast.success('Dziękuję za odpowiedź!')
      setVisible(false)
    } catch {
      toast.error('Nie udało się zapisać odpowiedzi')
    } finally {
      setSubmitting(false)
    }
  }

  if (!visible || !question) return null

  const opts = question.answerOptions

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl border bg-background p-4 shadow-lg animate-in slide-in-from-bottom-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">Szybkie pytanie</p>
          <p className="mt-1 text-sm font-medium leading-snug">{question.text}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Zamknij"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3">
        {/* single_select */}
        {question.answerType === 'single_select' && opts?.options && (
          <div className="flex flex-wrap gap-2">
            {opts.options.map((o) => (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => setAnswer(String(o.value))}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  answer === String(o.value)
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-background hover:bg-muted'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* boolean */}
        {question.answerType === 'boolean' && (
          <div className="flex gap-3">
            {[
              { value: 'true', label: opts?.labels?.['true'] ?? 'Tak' },
              { value: 'false', label: opts?.labels?.['false'] ?? 'Nie' },
            ].map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setAnswer(o.value)}
                className={`flex-1 rounded-xl py-2 text-sm font-medium transition-colors ${
                  answer === o.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border bg-background hover:bg-muted'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        )}

        {/* scale */}
        {question.answerType === 'scale' && opts?.min !== undefined && opts?.max !== undefined && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{opts.labels?.[String(opts.min)] ?? opts.min}</span>
              <span className="font-bold text-primary">{answer || '—'}</span>
              <span>{opts.labels?.[String(opts.max)] ?? opts.max}</span>
            </div>
            <input
              type="range"
              min={opts.min}
              max={opts.max}
              step={opts.step ?? 1}
              value={answer || String(opts.min)}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full accent-primary"
            />
          </div>
        )}

        {/* numeric */}
        {question.answerType === 'numeric' && (
          <input
            type="number"
            min={opts?.min}
            max={opts?.max}
            step={opts?.step ?? 1}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={opts?.placeholder ?? ''}
            className="w-full rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}

        {/* text_short */}
        {(question.answerType === 'text_short' || question.answerType === 'text_long') && (
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder={opts?.placeholder ?? ''}
            maxLength={500}
            className="w-full rounded-xl border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>

      {answer && (
        <button
          type="button"
          disabled={submitting}
          onClick={() => void submit()}
          className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {submitting ? 'Zapisuję...' : 'Zapisz odpowiedź'}
        </button>
      )}
    </div>
  )
}
