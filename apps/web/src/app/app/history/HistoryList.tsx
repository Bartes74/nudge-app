'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Clock, Star, ChevronRight, Dumbbell } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface WorkoutSet {
  id: string
  weight_kg: number | null
  reps: number | null
}

interface WorkoutExercise {
  id: string
  order_num: number
  was_substituted: boolean
  exercise: { name_pl: string; slug: string } | null
  sets: WorkoutSet[]
}

interface WorkoutLog {
  id: string
  started_at: string
  ended_at: string | null
  duration_min: number | null
  overall_rating: number | null
  pre_mood: string | null
  plan_workout: { name: string; day_label: string } | null
  exercises: WorkoutExercise[]
}

interface HistoryListProps {
  initialItems: WorkoutLog[]
  initialNextCursor: string | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pl-PL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function formatDuration(min: number | null) {
  if (!min) return null
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60}min`
}

function totalSets(exercises: WorkoutExercise[]) {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
}

export function HistoryList({ initialItems, initialNextCursor }: HistoryListProps) {
  const [items, setItems] = useState<WorkoutLog[]>(initialItems)
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadMore = async () => {
    if (loading || !nextCursor) return
    setLoading(true)
    try {
      const res = await fetch(`/api/workout/history?cursor=${encodeURIComponent(nextCursor)}`)
      if (!res.ok) return
      const { items: newItems, next_cursor } = (await res.json()) as {
        items: WorkoutLog[]
        next_cursor: string | null
      }
      setItems((prev) => [...prev, ...newItems])
      setNextCursor(next_cursor)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore()
      },
      { rootMargin: '200px' },
    )
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextCursor])

  if (items.length === 0) {
    return (
      <Card variant="outline" padding="xl" className="flex flex-col items-center gap-3 text-center">
        <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-body-m font-semibold tracking-tight">Brak zapisanych treningów</p>
        <p className="text-body-s text-muted-foreground">
          Ukończone sesje pojawią się tutaj.
        </p>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((log) => {
        const sets = totalSets(log.exercises)
        return (
          <Link key={log.id} href={`/app/history/${log.id}`} className="group">
            <Card
              variant="default"
              padding="md"
              className="flex items-center justify-between gap-3 transition-[border-color,background-color,transform] duration-200 ease-premium hover:border-foreground/30 hover:bg-surface-2/60 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] uppercase tabular-nums tracking-wider text-muted-foreground">
                  {formatDate(log.started_at)}
                </p>
                <p className="mt-1 truncate text-body-m font-semibold tracking-tight">
                  {log.plan_workout?.name ?? 'Trening'}
                </p>
                <div className="mt-1 flex items-center gap-3 font-mono text-body-s tabular-nums text-muted-foreground">
                  {log.duration_min != null && (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(log.duration_min)}
                    </span>
                  )}
                  <span>{sets} serii</span>
                  {log.overall_rating != null && (
                    <span className="inline-flex items-center gap-0.5">
                      <Star className="h-3 w-3 fill-brand text-brand" />
                      {log.overall_rating}
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
            </Card>
          </Link>
        )
      })}

      <div ref={sentinelRef} className="h-4" />

      {loading && (
        <p className="py-4 text-center font-mono text-body-s tabular-nums text-muted-foreground">
          Ładuję…
        </p>
      )}

      {!nextCursor && items.length > 0 && (
        <p className="py-2 text-center text-label uppercase text-muted-foreground">
          Koniec historii
        </p>
      )}
    </div>
  )
}
