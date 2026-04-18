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
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 bg-background sticky top-14 z-10">
        <Link
          href="/app/profile/conversations"
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Wróć do historii rozmów"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold leading-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">
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
