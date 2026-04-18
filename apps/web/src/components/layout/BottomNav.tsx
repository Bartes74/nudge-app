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
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/80 backdrop-blur-xl safe-bottom"
      aria-label="Nawigacja główna"
    >
      <ul className="flex h-[var(--bottom-nav-height)] items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href)

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  'group relative flex h-full flex-col items-center justify-center gap-1',
                  'text-[10px] font-semibold uppercase tracking-wider',
                  'transition-colors duration-200 ease-premium',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground/70 hover:text-foreground',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={cn(
                    'flex h-8 w-12 items-center justify-center rounded-full transition-colors duration-200 ease-premium',
                    isActive
                      ? 'bg-foreground text-background'
                      : 'bg-transparent',
                  )}
                >
                  <Icon
                    className={cn('h-[18px] w-[18px]', isActive && 'stroke-[2.2]')}
                    aria-hidden="true"
                  />
                </span>
                <span className="leading-none">{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
