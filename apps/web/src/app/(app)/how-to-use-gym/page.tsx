export default function HowToUseGymPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Jak korzystać z siłowni</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tu chodzi o podstawy organizacyjne, nie o bycie ekspertem od sprzętu.
        </p>
      </div>

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

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
        Aplikacja nie zastępuje lekarza, fizjoterapeuty ani trenera. Jeśli pojawia się ból,
        promieniujący dyskomfort, duszność nietypowa dla wysiłku albo inne czerwone flagi,
        zakończ trening i skonsultuj objawy ze specjalistą.
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
