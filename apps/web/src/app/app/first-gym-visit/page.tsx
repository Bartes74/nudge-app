export default function FirstGymVisitPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pierwsza wizyta na siłowni</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Pierwszy trening nie jest testem sprawności. Ma być spokojnym wejściem w nowe miejsce.
        </p>
      </div>

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
          'Nie musisz robić wszystkiego perfekcyjnie od pierwszego razu.',
        ]}
      />

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        Aplikacja pomaga Ci spokojnie zacząć, ale nie zastępuje lekarza, fizjoterapeuty ani
        trenera. Jeśli coś boli albo czujesz niepokojące objawy, przerwij trening i skonsultuj to
        ze specjalistą.
      </section>
    </div>
  )
}

function InfoCard(props: { title: string; items: string[] }) {
  return (
    <section className="rounded-xl border p-5">
      <h2 className="font-medium">{props.title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {props.items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </section>
  )
}
