import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type Props = {
  user: User
  title?: string
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function TopBar({ user, title }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm">
      <span className="text-lg font-semibold tracking-tight text-brand">
        {title ?? 'Nudge'}
      </span>

      <Link href="/app/profile" aria-label="Otwórz profil">
        <Avatar className="h-8 w-8 ring-2 ring-brand/20 transition-opacity hover:opacity-80">
          <AvatarImage
            src={user.user_metadata?.['avatar_url'] as string | undefined}
            alt="Avatar"
          />
          <AvatarFallback>{getInitials(user.email ?? 'NU')}</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  )
}
