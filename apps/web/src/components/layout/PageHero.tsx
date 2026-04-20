import Link from 'next/link'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageHero({
  eyebrow,
  titleEmphasis,
  titleMain,
  lede,
  meta,
  action,
  className,
}: {
  eyebrow: React.ReactNode
  titleEmphasis?: React.ReactNode
  titleMain: React.ReactNode
  lede?: React.ReactNode
  meta?: Array<{ label: React.ReactNode; value: React.ReactNode }>
  action?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('ds-hero relative', className)}>
      {action ? (
        <div className="absolute right-0 top-0 flex items-center">
          {action}
        </div>
      ) : null}
      <div className="ds-hero__eyebrow">{eyebrow}</div>
      <h1 className="ds-hero__title">
        {titleEmphasis ? <em>{titleEmphasis}</em> : null}
        {titleEmphasis ? <br /> : null}
        <span className="font-sans font-semibold">{titleMain}</span>
      </h1>
      {lede ? <p className="ds-hero__lede">{lede}</p> : null}
      {meta && meta.length > 0 ? (
        <div className="ds-hero__meta">
          {meta.map((item) => (
            <span key={String(item.label)}>
              {item.label}
              <strong>{item.value}</strong>
            </span>
          ))}
        </div>
      ) : null}
    </header>
  )
}

export function SectionHeader({
  number,
  title,
  description,
  aside,
}: {
  number?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  aside?: React.ReactNode
}) {
  return (
    <div className="ds-section__header">
      <div className="ds-section__header-main">
        {number ? <span className="ds-section__number">{number}</span> : null}
        <h2 className="ds-section__title">{title}</h2>
        {description ? <p className="ds-section__desc">{description}</p> : null}
      </div>
      {aside}
    </div>
  )
}

export function PageSection({
  number,
  title,
  description,
  aside,
  children,
  className,
}: {
  number?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  aside?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('ds-section', className)}>
      <SectionHeader
        number={number}
        title={title}
        description={description}
        aside={aside}
      />
      {children}
    </section>
  )
}

export function PageBackLink({
  href,
  label,
  icon: Icon = ArrowLeft,
}: {
  href: string
  label: React.ReactNode
  icon?: LucideIcon
}) {
  return (
    <Link
      href={href}
      className="ds-label inline-flex w-fit items-center gap-2 text-[var(--fg-secondary)] transition-colors hover:text-[var(--fg-primary)]"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  )
}
