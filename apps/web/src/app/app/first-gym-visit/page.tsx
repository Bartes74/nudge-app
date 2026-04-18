import Link from 'next/link'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { Card, CardEyebrow } from '@/components/ui/card'

export default function FirstGymVisitPage() {
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
          <span className="font-display italic text-muted-foreground">Pierwsza</span>
          <br />
          <span className="font-sans font-semibold">wizyta na siłowni.</span>
        </h1>
        <p className="text-body-m text-muted-foreground">
          Pierwszy trening nie jest testem sprawności — ma być spokojnym wejściem w nowe miejsce.
        </p>
      </header>

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
