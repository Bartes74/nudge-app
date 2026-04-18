import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AppUserRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'

type Props = {
  user: User
  title?: string
  role?: AppUserRole
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

export function TopBar({ user, title, role = 'user' }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-5 backdrop-blur-xl">
      <Link
        href="/app"
        aria-label="Nudge — strona główna"
        className="flex items-baseline gap-0 text-foreground transition-opacity hover:opacity-80"
      >
        <span className="font-display text-2xl italic leading-none tracking-tight">N</span>
        <span className="font-sans text-xl font-semibold leading-none tracking-tight">udge</span>
      </Link>

      {title && (
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-body-m font-medium tracking-tight text-foreground">
          {title}
        </span>
      )}

      <div className="flex items-center gap-3">
        {role === 'admin' && (
          <Link
            href="/admin"
            aria-label="Otwórz panel admina"
            className={cn(
              'rounded-full border border-border px-2.5 py-1 text-label uppercase text-muted-foreground',
              'transition-colors hover:border-brand hover:text-brand',
            )}
          >
            Admin
          </Link>
        )}

        <Link
          href="/app/profile"
          aria-label="Otwórz profil"
          className="rounded-full ring-offset-background transition-[box-shadow,transform] duration-200 ease-premium hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage
              src={user.user_metadata?.['avatar_url'] as string | undefined}
              alt="Avatar"
            />
            <AvatarFallback className="bg-surface-2 text-body-s font-medium">
              {getInitials(user.email ?? 'NU')}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
