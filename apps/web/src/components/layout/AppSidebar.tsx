'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import type { User } from '@supabase/supabase-js'
import type { AppUserRole } from '@/lib/auth/roles'

const NAV_ITEMS = [
  { href: '/app', label: 'Dziś', number: '01', exact: true },
  { href: '/app/plan', label: 'Plan', number: '02', exact: false },
  { href: '/app/nutrition', label: 'Jedzenie', number: '03', exact: false },
  { href: '/app/progress', label: 'Postępy', number: '04', exact: false },
  { href: '/app/profile', label: 'Profil', number: '05', exact: false },
] as const

function isActivePath(pathname: string, href: string, exact: boolean): boolean {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({
  user,
  role,
}: {
  user: User
  role: AppUserRole
}) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const activeTheme = mounted && theme === 'dark' ? 'dark' : 'light'
  const nextTheme = activeTheme === 'dark' ? 'light' : 'dark'
  const themeLabel = activeTheme === 'dark' ? '◑ Tryb jasny' : '◐ Tryb ciemny'

  return (
    <aside className="ds-sidebar">
      <div className="ds-sidebar__brand">
        <Link href="/app" className="ds-sidebar__brand-mark">
          Nudge
        </Link>
        <span className="ds-sidebar__brand-sub">Adaptacyjny AI coach treningowo-żywieniowy</span>
      </div>

      <nav className="ds-sidebar__group" aria-label="Nawigacja główna">
        <span className="ds-sidebar__group-label">Nawigacja</span>
        {NAV_ITEMS.map(({ href, label, number, exact }) => (
          <Link
            key={href}
            href={href}
            className="ds-sidebar__link"
            aria-current={isActivePath(pathname, href, exact) ? 'page' : undefined}
          >
            <span className="ds-sidebar__link-num">{number}</span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {role === 'admin' && (
        <div className="ds-sidebar__group">
          <span className="ds-sidebar__group-label">Panel</span>
          <Link href="/admin" className="ds-sidebar__link">
            <span className="ds-sidebar__link-num">A1</span>
            <span>Admin</span>
          </Link>
        </div>
      )}

      <div className="ds-sidebar__footer">
        <button
          type="button"
          className="ds-theme-toggle"
          onClick={() => setTheme(nextTheme)}
          suppressHydrationWarning
        >
          {themeLabel}
        </button>
        <div className="text-[11px] leading-relaxed text-[var(--fg-tertiary)]">
          <div className="font-mono uppercase tracking-[var(--tracking-wide)]">Konto</div>
          <div>{user.email ?? '—'}</div>
        </div>
      </div>
    </aside>
  )
}
