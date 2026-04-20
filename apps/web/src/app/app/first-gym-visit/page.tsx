import { AlertTriangle } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Card, CardEyebrow } from '@/components/ui/card'

export default function FirstGymVisitPage() {
  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app" label="Dziś" />

      <PageHero
        eyebrow="Przewodnik"
        titleEmphasis="Pierwsza"
        titleMain="wizyta na siłowni."
        lede="Pierwszy trening nie jest testem sprawności — ma być spokojnym wejściem w nowe miejsce."
      />

      <PageSection
        number="01 — Start"
        title="Co warto wiedzieć przed wejściem"
        description="Tylko najważniejsze rzeczy, które pomagają poczuć się pewniej przy pierwszej wizycie."
        className="gap-4"
      >
        <InfoCard
          title="Co zabrać"
          items={[
            'Wygodne buty i ubranie do ruchu.',
            'Butelkę wody.',
            'Mały ręcznik.',
            'Telefon z otwartym dzisiejszym treningiem.',
          ]}
        />

        <InfoCard
          title="Jak wygląda typowa wizyta"
          items={[
            'Wejście i odłożenie rzeczy.',
            'Krótka rozgrzewka.',
            'Prosty trening według kolejnych kroków.',
            'Spokojne wyciszenie i wyjście.',
          ]}
        />

        <InfoCard
          title="Ważne na start"
          items={[
            'Nie musisz znać wszystkich urządzeń.',
            'Możesz poprosić obsługę o pomoc w ustawieniu sprzętu.',
            'Nie musisz robić wszystkiego perfekcyjnie od razu.',
          ]}
        />
      </PageSection>

      <Card variant="default" padding="md" className="ring-1 ring-inset ring-warning/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-body-s leading-relaxed text-foreground">
            Aplikacja pomaga Ci spokojnie zacząć, ale nie zastępuje lekarza, fizjoterapeuty ani
            trenera. Jeśli coś boli albo czujesz niepokojące objawy, przerwij trening i skonsultuj
            to ze specjalistą.
          </p>
        </div>
      </Card>
    </div>
  )
}

function InfoCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card variant="default" padding="md">
      <CardEyebrow>{title}</CardEyebrow>
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
    </Card>
  )
}
