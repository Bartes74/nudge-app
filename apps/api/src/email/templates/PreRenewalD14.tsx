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

interface PreRenewalD14Props {
  firstName: string
  workoutsThisYear: number
  mealsLoggedThisYear: number
  checkInsThisYear: number
  renewalDate: string
  renewalAmount: string
  portalUrl: string
}

export function PreRenewalD14Email({
  firstName,
  workoutsThisYear,
  mealsLoggedThisYear,
  checkInsThisYear,
  renewalDate,
  renewalAmount,
  portalUrl,
}: PreRenewalD14Props) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Rok z Nudge — podsumowanie Twoich postępów, {firstName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Rok z Nudge — oto co osiągnąłeś/aś</Heading>

          <Text style={text}>Cześć, {firstName}!</Text>

          <Text style={text}>
            Za 14 dni odnawia się Twój roczny plan Nudge. Zanim to nastąpi, mamy dla Ciebie
            podsumowanie całego roku:
          </Text>

          <Section style={statsGrid}>
            <Section style={statItem}>
              <Text style={statNum}>{workoutsThisYear}</Text>
              <Text style={statLbl}>treningów</Text>
            </Section>
            <Section style={statItem}>
              <Text style={statNum}>{mealsLoggedThisYear}</Text>
              <Text style={statLbl}>posiłków</Text>
            </Section>
            <Section style={statItem}>
              <Text style={statNum}>{checkInsThisYear}</Text>
              <Text style={statLbl}>check-inów</Text>
            </Section>
          </Section>

          <Text style={text}>
            Twój plan zostanie automatycznie odnowiony <strong>{renewalDate}</strong>{' '}
            za <strong>{renewalAmount}</strong>. Nie musisz nic robić.
          </Text>

          <Text style={text}>
            Jeśli chcesz zmienić plan, zaktualizować dane karty lub wstrzymać subskrypcję —
            zrób to w portalu poniżej.
          </Text>

          <Button style={button} href={portalUrl}>
            Zarządzaj subskrypcją →
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Nudge AI Coach · Dziękujemy za rok razem. Pytania? Odpowiedz na tego emaila.
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
const statsGrid = { display: 'flex', gap: '12px', margin: '16px 0' }
const statItem = {
  flex: 1,
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '12px',
  textAlign: 'center' as const,
}
const statNum = { fontSize: '28px', fontWeight: '700', color: '#16a34a', margin: '0' }
const statLbl = { fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }
const button = {
  display: 'inline-block',
  backgroundColor: '#111827',
  color: '#ffffff',
  borderRadius: '8px',
  padding: '12px 24px',
  fontSize: '15px',
  fontWeight: '600',
  textDecoration: 'none',
  margin: '16px 0',
}
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af' }

export default PreRenewalD14Email
