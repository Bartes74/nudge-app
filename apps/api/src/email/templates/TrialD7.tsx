import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface TrialD7Props {
  firstName: string
  workoutsCompleted: number
  mealsLogged: number
  paywallUrl: string
  monthlyPrice: string
  yearlyPrice: string
}

export function TrialD7Email({
  firstName,
  workoutsCompleted,
  mealsLogged,
  paywallUrl,
  monthlyPrice,
  yearlyPrice,
}: TrialD7Props) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Ostatni dzień trialu — kontynuuj z {firstName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Twój 7-dniowy trial dobiega końca</Heading>

          <Text style={text}>Cześć, {firstName}!</Text>

          <Text style={text}>
            Dziś ostatni dzień Twojego darmowego trialu. Oto co osiągnąłeś/aś w tym czasie:
          </Text>

          <Section style={statsRow}>
            <Section style={statBox}>
              <Text style={statNumber}>{workoutsCompleted}</Text>
              <Text style={statLabel}>treningów</Text>
            </Section>
            <Section style={statBox}>
              <Text style={statNumber}>{mealsLogged}</Text>
              <Text style={statLabel}>posiłków</Text>
            </Section>
          </Section>

          <Text style={text}>
            Jutro dostęp do treningów i coachingu zostanie wstrzymany — ale <strong>wszystkie
            Twoje dane są zachowane</strong>. Wróć kiedy chcesz, a znajdziesz wszystko na
            swoim miejscu.
          </Text>

          <Text style={text}>
            Jeśli chcesz kontynuować bez przerwy, wybierz plan:
          </Text>

          <Button style={button} href={paywallUrl}>
            Kontynuuj z Nudge →
          </Button>

          <Section style={priceNote}>
            <Text style={priceText}>
              📅 Miesięcznie: <strong>{monthlyPrice}/mc</strong>
            </Text>
            <Text style={priceText}>
              🏆 Rocznie: <strong>{yearlyPrice}/rok</strong> — oszczędzasz 41%
            </Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Nudge AI Coach · Możesz anulować kiedy chcesz.
            Masz pytania? Odpowiedz na tego emaila.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = { backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }
const container = {
  margin: '0 auto',
  padding: '24px',
  maxWidth: '560px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
}
const h1 = { fontSize: '22px', fontWeight: '700', color: '#111827', marginBottom: '8px' }
const text = { fontSize: '15px', color: '#374151', lineHeight: '1.6' }
const statsRow = { display: 'flex', gap: '16px', margin: '16px 0' }
const statBox = {
  flex: 1,
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
}
const statNumber = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#16a34a',
  margin: '0',
}
const statLabel = { fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }
const button = {
  display: 'inline-block',
  backgroundColor: '#16a34a',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  margin: '16px 0',
}
const priceNote = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '8px 0',
}
const priceText = { fontSize: '14px', color: '#374151', margin: '4px 0' }
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af' }

export default TrialD7Email
