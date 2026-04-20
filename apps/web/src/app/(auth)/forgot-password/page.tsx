import type { Metadata } from 'next'
import { PageBackLink, PageHero, PageSection } from '@/components/layout/PageHero'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = { title: 'Reset hasła' }

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-12">
      <PageBackLink href="/signin" label="Wróć do logowania" />

      <PageHero
        eyebrow="Reset"
        titleEmphasis="Zresetuj"
        titleMain="hasło."
        lede="Podaj swój e-mail, a wyślemy Ci link do ustawienia nowego hasła."
        className="text-center"
      />

      <PageSection
        number="01 — E-mail"
        title="Poproś o link"
        description="Wpisz adres e-mail używany przy logowaniu."
      >
        <ForgotPasswordForm />
      </PageSection>
    </div>
  )
}
