'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, Dumbbell, Salad, TrendingUp, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/app', label: 'Dziś', icon: CalendarDays, exact: true },
  { href: '/app/plan', label: 'Plan', icon: Dumbbell, exact: false },
  { href: '/app/nutrition', label: 'Jedzenie', icon: Salad, exact: false },
  { href: '/app/progress', label: 'Postępy', icon: TrendingUp, exact: false },
  { href: '/app/profile', label: 'Profil', icon: User, exact: false },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm safe-bottom"
      aria-label="Nawigacja główna"
    >
      <ul className="flex h-[var(--bottom-nav-height)] items-center">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={cn('h-5 w-5', isActive && 'stroke-[2.5]')}
                  aria-hidden="true"
                />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
