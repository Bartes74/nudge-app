import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CoachChat } from '@/components/coach/CoachChat'

interface Props {
  params: Promise<{ conversationId: string }>
  searchParams: Promise<{ prefill?: string }>
}

export default async function CoachConversationPage({ params, searchParams }: Props) {
  const { conversationId } = await params
  const { prefill } = await searchParams

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/signin')

  const { data: conversation } = await supabase
    .from('coach_conversations')
    .select('id, entry_point, context_entity_type, started_at')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .single()

  if (!conversation) notFound()

  const { data: messages } = await supabase
    .from('coach_messages')
    .select('id, role, content, guardrail_flagged, created_at')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: true })

  const title = getTitle(conversation.entry_point, conversation.context_entity_type)

  return (
    <div className="flex h-[calc(100svh-var(--bottom-nav-height)-3.5rem)] flex-col">
      <div className="sticky top-14 z-10 flex items-center gap-3 border-b border-border/60 bg-background/80 px-5 py-3 backdrop-blur-xl">
        <Link
          href="/app/profile/conversations"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="Wróć do historii rozmów"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-col gap-0.5">
          <h1 className="text-body-m font-semibold tracking-tight leading-tight">{title}</h1>
          <p className="font-mono text-[11px] tabular-nums uppercase tracking-wider text-muted-foreground">
            {new Date(conversation.started_at).toLocaleDateString('pl-PL', {
              day: 'numeric',
              month: 'short',
            })}
          </p>
        </div>
      </div>

      <CoachChat
        conversationId={conversationId}
        initialMessages={(messages ?? []).map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          guardrail_flagged: m.guardrail_flagged ?? false,
          created_at: m.created_at,
        }))}
        prefillMessage={prefill}
      />
    </div>
  )
}

function getTitle(entryPoint: string, contextType: string | null): string {
  if (contextType === 'exercise') return 'Technika ćwiczenia'
  if (contextType === 'meal') return 'Pytanie o dietę'
  if (entryPoint === 'proactive_coach') return 'Wiadomość od coacha'
  return 'Chat z coachem'
}
