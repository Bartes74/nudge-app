'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { AppUserRole } from '@/lib/auth/roles'
import { cn } from '@/lib/utils'

type Props = {
  userEmail?: string | null
  avatarUrl?: string | null
  title?: string
  role?: AppUserRole
}

function getInitials(email: string): string {
  return email.slice(0, 2).toUpperCase()
}

function getMobileBackAction(
  pathname: string,
): { href: string; label: string } | null {
  if (pathname === '/app') {
    return null
  }

  const routeMap: Array<{ match: RegExp; href: string; label: string }> = [
    { match: /^\/app\/progress\/weight(?:\/|$)/, href: '/app/progress', label: 'Postępy' },
    { match: /^\/app\/history(?:\/|$)/, href: '/app/progress', label: 'Postępy' },
    { match: /^\/app\/plan(?:\/history|\/exercise(?:\/|$)|\/workout(?:\/|$))/, href: '/app/plan', label: 'Plan' },
    { match: /^\/app\/nutrition\/log-weight(?:\/|$)/, href: '/app/nutrition', label: 'Jedzenie' },
    { match: /^\/app\/nutrition\/log(?:\/|$)/, href: '/app/nutrition', label: 'Jedzenie' },
    { match: /^\/app\/billing(?:\/|$)/, href: '/app/profile', label: 'Profil' },
    { match: /^\/app\/checkin(?:\/|$)/, href: '/app', label: 'Dziś' },
    { match: /^\/app\/trainer-consultation(?:\/|$)/, href: '/app', label: 'Dziś' },
    { match: /^\/app\/first-gym-visit(?:\/|$)/, href: '/app', label: 'Dziś' },
    { match: /^\/app\/how-to-use-gym(?:\/|$)/, href: '/app', label: 'Dziś' },
    { match: /^\/app\/today\/workout(?:\/|$)/, href: '/app', label: 'Dziś' },
  ]

  const match = routeMap.find((route) => route.match.test(pathname))
  return match ? { href: match.href, label: match.label } : null
}

export function TopBar({ userEmail, avatarUrl, title, role = 'user' }: Props) {
  const pathname = usePathname()
  const backAction = getMobileBackAction(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-border/60 bg-background/70 px-5 backdrop-blur-xl">
      <div className="min-w-[7rem]">
        {backAction ? (
          <Link
            href={backAction.href}
            aria-label={`Wróć do sekcji ${backAction.label}`}
            className="inline-flex items-center gap-1.5 ds-label text-[var(--fg-secondary)] transition-colors hover:text-[var(--fg-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backAction.label}
          </Link>
        ) : null}
      </div>

      <Link
        href="/app"
        aria-label="Nudge — strona główna"
        className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-baseline gap-0 text-foreground transition-opacity hover:opacity-80"
      >
        <span className="font-display text-2xl italic leading-none tracking-tight">N</span>
        <span className="font-sans text-xl font-semibold leading-none tracking-tight">udge</span>
      </Link>

      {title && (
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 text-body-m font-medium tracking-tight text-foreground">
          {title}
        </span>
      )}

      <div className="ml-auto flex items-center gap-3">
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
            <AvatarImage src={avatarUrl ?? undefined} alt="Avatar" />
            <AvatarFallback className="bg-surface-2 text-body-s font-medium">
              {getInitials(userEmail ?? 'NU')}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  )
}
