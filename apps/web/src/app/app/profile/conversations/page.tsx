import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, ChevronRight, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardEyebrow } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function ConversationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const { data: conversations } = await supabase
    .from('coach_conversations')
    .select(
      `id, entry_point, context_entity_type, started_at, last_message_at, closed,
       coach_messages(count)`,
    )
    .eq('user_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('started_at', { ascending: false })
    .limit(50)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-5 pt-6 pb-24 animate-stagger">
      <Link
        href="/app/profile"
        className="inline-flex w-fit items-center gap-1.5 text-label uppercase text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Profil
      </Link>

      <header className="flex flex-col gap-2">
        <p className="text-label uppercase text-muted-foreground">Coach</p>
        <h1 className="text-display-l font-display leading-[1.05] tracking-tight text-balance">
          <span className="font-display italic text-muted-foreground">Historia</span>
          <br />
          <span className="font-sans font-semibold">rozmów.</span>
        </h1>
      </header>

      {!conversations || conversations.length === 0 ? (
        <Card variant="outline" padding="xl" className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-body-m font-semibold tracking-tight">Brak rozmów</p>
            <p className="text-body-s text-muted-foreground">
              Zadaj pierwsze pytanie coachowi.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/app/coach">Zacznij rozmowę</Link>
          </Button>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {conversations.map((conv) => {
            const msgCount = (conv.coach_messages as unknown as { count: number }[])?.[0]?.count ?? 0
            const date = conv.last_message_at ?? conv.started_at
            return (
              <Link key={conv.id} href={`/app/coach/${conv.id}`} className="group">
                <Card
                  variant="default"
                  padding="sm"
                  className="flex items-center gap-3 transition-[border-color,background-color,transform] duration-200 ease-premium hover:border-foreground/30 hover:bg-surface-2/60 active:scale-[0.99]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted text-brand">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-body-m font-medium tracking-tight">
                        {getConvTitle(conv.entry_point, conv.context_entity_type)}
                      </p>
                      {conv.closed && (
                        <Badge variant="label" className="px-0 text-[10px]">
                          zakończona
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 font-mono text-body-s tabular-nums text-muted-foreground">
                      {msgCount} {msgCount === 1 ? 'wiadomość' : 'wiadomości'} ·{' '}
                      {new Date(date).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function getConvTitle(entryPoint: string, contextType: string | null): string {
  if (contextType === 'exercise') return 'Technika ćwiczenia'
  if (contextType === 'meal') return 'Pytanie o dietę'
  if (entryPoint === 'proactive_coach') return 'Wiadomość od coacha'
  if (entryPoint === 'exercise_shortcut') return 'Ćwiczenie'
  if (entryPoint === 'meal_shortcut') return 'Dieta'
  return 'Rozmowa z coachem'
}
