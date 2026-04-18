import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Card, CardEyebrow } from '@/components/ui/card'

export default function HowToUseGymPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Dzisiaj
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Przewodnik</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Jak korzystać</span>
          <br />
          <span className="font-sans font-semibold">z siłowni.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Podstawy organizacyjne — nie musisz być ekspertem od sprzętu, żeby wejść dobrze w trening.
        </p>
      </header>

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
