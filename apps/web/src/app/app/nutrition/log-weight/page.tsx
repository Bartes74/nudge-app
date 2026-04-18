import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import { LogWeightForm } from './LogWeightForm'

export const metadata: Metadata = { title: 'Zaloguj wagę' }

export default async function LogWeightPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lastMeasurement } = await supabase
    .from('body_measurements')
    .select('weight_kg, measured_at')
    .eq('user_id', user!.id)
    .not('weight_kg', 'is', null)
    .order('measured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <Link href="/app/nutrition" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-semibold">Zaloguj wagę</h1>
      </div>

      {lastMeasurement && (
        <div className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Poprzedni pomiar:{' '}
          <strong className="text-foreground">
            {Number(lastMeasurement.weight_kg).toFixed(1)} kg
          </strong>{' '}
          —{' '}
          {new Date(lastMeasurement.measured_at as string).toLocaleDateString('pl-PL', {
            day: 'numeric',
            month: 'long',
          })}
        </div>
      )}

      <LogWeightForm />
    </div>
  )
}
