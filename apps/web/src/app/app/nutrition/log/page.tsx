import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, MessageSquare, PenLine, ChevronRight } from 'lucide-react'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { Card } from '@/components/ui/card'

export const metadata: Metadata = { title: 'Dodaj posiłek' }

const OPTIONS = [
  {
    href: '/app/nutrition/log/photo',
    icon: Camera,
    title: 'Zdjęcie',
    description: 'Zrób zdjęcie — AI rozpozna składniki',
    tone: 'brand' as const,
  },
  {
    href: '/app/nutrition/log/photo?note=1',
    icon: MessageSquare,
    title: 'Zdjęcie + notatka',
    description: 'Dodaj opis dla lepszej dokładności',
    tone: 'foreground' as const,
  },
  {
    href: '/app/nutrition/log/manual',
    icon: PenLine,
    title: 'Ręcznie',
    description: 'Wpisz składniki i ilość — resztę oszacujemy',
    tone: 'muted' as const,
  },
]

export default function NutritionLogPage() {
  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/app/nutrition" label="Jedzenie" />

      <PageHero
        eyebrow="Nowy posiłek"
        titleEmphasis="Jak chcesz"
        titleMain="zarejestrować?"
        lede="Wybierz sposób, który będzie dla Ciebie najwygodniejszy. Każda opcja prowadzi do osobnego flow zapisu."
      />

      <PageSection
        number="01 — Wybór"
        title="Sposób dodania posiłku"
        description="Możesz dodać samo zdjęcie, zdjęcie z notatką albo wpisać posiłek ręcznie."
        className="gap-4"
      >
        {OPTIONS.map(({ href, icon: Icon, title, description, tone }) => {
          const iconClass =
            tone === 'brand'
              ? 'bg-brand-muted text-brand'
              : tone === 'foreground'
                ? 'bg-foreground text-background'
                : 'bg-surface-2 text-muted-foreground'
          return (
            <Link key={href} href={href} className="group">
              <Card
                variant="default"
                padding="sm"
                className="flex items-center gap-4 transition-[border-color,background-color,transform] duration-200 ease-premium hover:border-foreground/30 hover:bg-surface-2/60 active:scale-[0.99]"
              >
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-body-m font-semibold tracking-tight">{title}</p>
                  <p className="mt-0.5 text-body-s text-muted-foreground">{description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-premium group-hover:translate-x-0.5" />
              </Card>
            </Link>
          )
        })}
      </PageSection>
    </div>
  )
}
