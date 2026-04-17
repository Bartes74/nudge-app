'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { posthog } from '@/lib/posthog'

function recordProductEvent(eventName: string, properties: Record<string, unknown>): void {
  void fetch('/api/product-events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event_name: eventName,
      properties,
    }),
  })
}

export default function BeforeTrainerConsultationPage() {
  useEffect(() => {
    posthog.capture('trainer_consultation_prompt_shown', {
      surface: 'before_trainer_consultation',
    })
    recordProductEvent('trainer_consultation_prompt_shown', {
      surface: 'before_trainer_consultation',
    })
  }, [])

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Przed rozmową z trenerem</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          To naturalny kolejny krok, kiedy chcesz wejść na trochę wyższy poziom albo uporządkować technikę.
        </p>
      </div>

      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Po co iść do trenera</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trener może szybko sprawdzić ustawienie sprzętu, technikę prostych ćwiczeń i podpowiedzieć, czego na razie unikać.
        </p>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Co powiedzieć o sobie</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Dopiero buduję regularność i chcę prostych wskazówek krok po kroku.</li>
          <li>• To są ćwiczenia albo urządzenia, które już robiłem/am.</li>
          <li>• To były dla mnie rzeczy niejasne albo trudne.</li>
        </ul>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Jakie postępy zgłosić</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Ile treningów udało Ci się zrobić.</li>
          <li>• Co zaczęło być bardziej zrozumiałe.</li>
          <li>• Przy jakich ruchach czujesz się już pewniej.</li>
        </ul>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-medium">Jakie trudności zgłosić</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Co było niejasne.</li>
          <li>• Co było za trudne.</li>
          <li>• Gdzie pojawiał się dyskomfort albo ból.</li>
        </ul>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="font-medium">O co zapytać</h2>
        <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
          <li>• Jak ustawić to urządzenie pod mój wzrost?</li>
          <li>• Jak sprawdzić, czy ruch robię poprawnie?</li>
          <li>• Które ćwiczenie będzie dla mnie prostszą wersją na teraz?</li>
        </ul>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        Ta aplikacja nie zastępuje lekarza, fizjoterapeuty ani trenera. Jeśli pojawia się ból,
        zawroty głowy, duszność nietypowa dla wysiłku albo inne niepokojące objawy, przerwij
        trening i skonsultuj sytuację ze specjalistą.
      </section>

      <Link
        href="/app/trainer-consultation/after"
        className="rounded-xl bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground"
      >
        Mam to za sobą — przejdź dalej
      </Link>
    </div>
  )
}
