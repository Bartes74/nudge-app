import type { Metadata } from 'next'
import { TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Postępy' }

export default function ProgressPage() {
  return (
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-semibold">Postępy</h1>
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed bg-muted/40 p-8 text-center">
        <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          Tu zobaczysz swoje postępy.
        </p>
      </div>
    </div>
  )
}
