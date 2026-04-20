'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, AlertTriangle } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Button } from '@/components/ui/button'
import { Card, CardEyebrow } from '@/components/ui/card'
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
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app" label="Dziś" />

      <PageHero
        eyebrow="Przewodnik"
        titleEmphasis="Przed rozmową"
        titleMain="z trenerem."
        lede="To naturalny kolejny krok, kiedy chcesz wejść na wyższy poziom albo uporządkować technikę."
      />

      <PageSection
        number="01 — Przygotowanie"
        title="Co warto powiedzieć i o co zapytać"
        description="Najkrótsza lista rzeczy, które pomogą dobrze wykorzystać rozmowę z trenerem."
        className="gap-4"
      >
        <InfoCard
          title="Po co iść do trenera"
          description="Trener może szybko sprawdzić ustawienie sprzętu, technikę prostych ćwiczeń i podpowiedzieć, czego na razie unikać."
        />

        <InfoCard
          title="Co powiedzieć o sobie"
          items={[
            'Dopiero buduję regularność i chcę prostych wskazówek krok po kroku.',
            'To są ćwiczenia albo urządzenia, które już robiłem/am.',
            'To były dla mnie rzeczy niejasne albo trudne.',
          ]}
        />

        <InfoCard
          title="Jakie postępy zgłosić"
          items={[
            'Ile treningów udało Ci się zrobić.',
            'Co zaczęło być bardziej zrozumiałe.',
            'Przy jakich ruchach czujesz się już pewniej.',
          ]}
        />

        <InfoCard
          title="Jakie trudności zgłosić"
          items={[
            'Co było niejasne.',
            'Co było za trudne.',
            'Gdzie pojawiał się dyskomfort albo ból.',
          ]}
        />

        <InfoCard
          title="O co zapytać"
          items={[
            'Jak ustawić to urządzenie pod mój wzrost?',
            'Jak sprawdzić, czy ruch robię poprawnie?',
            'Które ćwiczenie będzie dla mnie prostszą wersją na teraz?',
          ]}
        />
      </PageSection>

      <Card variant="default" padding="md" className="ring-1 ring-inset ring-warning/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-body-s leading-relaxed text-foreground">
            Ta aplikacja nie zastępuje lekarza, fizjoterapeuty ani trenera. Jeśli pojawia się ból,
            zawroty głowy, duszność nietypowa dla wysiłku albo inne niepokojące objawy, przerwij
            trening i skonsultuj sytuację ze specjalistą.
          </p>
        </div>
      </Card>

      <Button asChild size="hero" className="w-full gap-2">
        <Link href="/app/trainer-consultation/after">
          Mam to za sobą — przejdź dalej
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

function InfoCard({
  title,
  items,
  description,
}: {
  title: string
  items?: string[]
  description?: string
}) {
  return (
    <Card variant="default" padding="md">
      <CardEyebrow>{title}</CardEyebrow>
      {description ? (
        <p className="mt-2 text-body-m leading-relaxed text-foreground">{description}</p>
      ) : null}
      {items ? (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-body-m leading-relaxed text-foreground"
            >
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  )
}
