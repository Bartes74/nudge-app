import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, MessageSquare, PenLine, ChevronRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Dodaj posiłek' }

export default function NutritionLogPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-semibold">Dodaj posiłek</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wybierz sposób rejestracji
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Link
          href="/app/nutrition/log/photo"
          className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 active:scale-[0.98]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
            <Camera className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Zdjęcie</p>
            <p className="text-sm text-muted-foreground">
              Zrób zdjęcie — AI rozpozna składniki
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/app/nutrition/log/photo?note=1"
          className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 active:scale-[0.98]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10">
            <MessageSquare className="h-5 w-5 text-violet-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Zdjęcie + notatka</p>
            <p className="text-sm text-muted-foreground">
              Dodaj opis dla lepszej dokładności
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        <Link
          href="/app/nutrition/log/manual"
          className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50 active:scale-[0.98]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
            <PenLine className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="font-medium">Ręcznie</p>
            <p className="text-sm text-muted-foreground">
              Wpisz składniki i kalorie samodzielnie
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  )
}
