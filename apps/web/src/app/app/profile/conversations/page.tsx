import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageCircle, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
    <div className="container max-w-lg py-6">
      <h1 className="text-xl font-bold mb-4">Historia rozmów z coachem</h1>

      {(!conversations || conversations.length === 0) ? (
        <div className="text-center text-muted-foreground py-16">
          <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nie masz jeszcze żadnych rozmów.</p>
          <Link
            href="/app/coach"
            className="mt-4 inline-block text-brand text-sm underline underline-offset-2"
          >
            Zacznij rozmowę
          </Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {conversations.map((conv) => {
            const msgCount = (conv.coach_messages as unknown as { count: number }[])?.[0]?.count ?? 0
            const date = conv.last_message_at ?? conv.started_at
            return (
              <li key={conv.id}>
                <Link
                  href={`/app/coach/${conv.id}`}
                  className="flex items-center gap-3 rounded-xl border p-4 hover:bg-muted/40 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 text-brand shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {getConvTitle(conv.entry_point, conv.context_entity_type)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {msgCount} {msgCount === 1 ? 'wiadomość' : 'wiadomości'} ·{' '}
                      {new Date(date).toLocaleDateString('pl-PL', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {conv.closed && (
                    <span className="text-xs text-muted-foreground mr-1">zakończona</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
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
