import { AlertTriangle } from 'lucide-react'

export type GuardrailReason = 'underage' | 'pregnancy'

interface GuardrailBlockProps {
  reason: GuardrailReason
}

const MESSAGES: Record<GuardrailReason, { title: string; body: string }> = {
  underage: {
    title: 'Nudge jest przeznaczony dla osób od 18. roku życia',
    body: 'Aplikacja nie jest odpowiednia dla nieletnich. Jeśli jesteś rodzicem i szukasz wsparcia dla dziecka, skontaktuj się z lekarzem sportowym lub pediatrycznym dietetykiem.',
  },
  pregnancy: {
    title: 'Ciąża wymaga specjalistycznej opieki',
    body: 'Nudge nie jest odpowiedni podczas ciąży. Wszelkie plany treningowe i żywieniowe powinny być konsultowane z Twoim lekarzem prowadzącym lub położnikiem.',
  },
}

export function GuardrailBlock({ reason }: GuardrailBlockProps) {
  const { title, body } = MESSAGES[reason]

  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-6 text-center max-w-sm mx-auto py-8 px-4"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
      <a
        href="/"
        className="text-sm text-primary underline underline-offset-4"
      >
        Wróć na stronę główną
      </a>
    </div>
  )
}
