import { AlertTriangle } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Card, CardEyebrow } from '@/components/ui/card'

export default function HowToUseGymPage() {
  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app" label="Dziś" />

      <PageHero
        eyebrow="Przewodnik"
        titleEmphasis="Jak korzystać"
        titleMain="z siłowni."
        lede="Podstawy organizacyjne — nie musisz znać całej siłowni, żeby dobrze wejść w trening."
      />

      <PageSection
        number="01 — Podstawy"
        title="Najważniejsze zasady"
        description="Tu są tylko rzeczy, które pomagają spokojnie wejść w trening i nie pogubić się na starcie."
        className="gap-4"
      >
        <InfoCard
          title="Jak ogarnąć przestrzeń"
          items={[
            'Na początku znajdź tylko to urządzenie, które jest potrzebne teraz.',
            'Nie musisz znać całego układu siłowni.',
            'Jeśli czegoś nie wiesz, zapytanie obsługi jest normalne.',
          ]}
        />

        <InfoCard
          title="Jak korzystać ze sprzętu"
          items={[
            'Zanim zaczniesz, sprawdź siedzenie, uchwyty i obciążenie startowe.',
            'Po serii odłóż rzeczy na miejsce.',
            'Jeśli urządzenie jest zajęte, wybierz zamiennik albo wróć do niego później.',
          ]}
        />

        <InfoCard
          title="Kiedy odpocząć albo przerwać"
          items={[
            'Gdy ruch staje się niejasny i tracisz kontrolę.',
            'Gdy pojawia się ból zamiast zwykłego wysiłku.',
            'Gdy czujesz zawrót głowy, nietypową duszność albo ból w klatce piersiowej.',
          ]}
        />
      </PageSection>

      <Card variant="default" padding="md" className="ring-1 ring-inset ring-warning/20">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <p className="text-body-s leading-relaxed text-foreground">
            Aplikacja nie zastępuje lekarza, fizjoterapeuty ani trenera. Jeśli pojawia się ból,
            promieniujący dyskomfort, duszność nietypowa dla wysiłku albo inne czerwone flagi,
            zakończ trening i skonsultuj objawy ze specjalistą.
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
