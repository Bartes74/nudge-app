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

interface InactivityD60Props {
  firstName: string
  lastProgressNote: string
  discountPercent: number
  couponCode: string
  returnUrl: string
}

export function InactivityD60Email({
  firstName,
  lastProgressNote,
  discountPercent,
  couponCode,
  returnUrl,
}: InactivityD60Props) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Minęło 60 dni. Twój progres wciąż na Ciebie czeka, {firstName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Wróćmy tam, gdzie skończyłeś/aś</Heading>

          <Text style={text}>Cześć, {firstName}!</Text>

          <Text style={text}>
            Minęło 60 dni od ostatniego treningu w Nudge. Ale nic się nie straciło.
          </Text>

          <Section style={progressCard}>
            <Text style={progressLabel}>Twój ostatni postęp:</Text>
            <Text style={progressNote}>{lastProgressNote}</Text>
          </Section>

          <Text style={text}>
            Wróć teraz i zacznij od razu — Nudge pamięta Twój profil, historię i plan.
            Żadnego wypełniania od nowa.
          </Text>

          <Section style={discountBox}>
            <Text style={discountHeadline}>
              🎁 Tylko dla Ciebie: <strong>{discountPercent}% zniżki</strong> na pierwszy miesiąc powrotu
            </Text>
            <Text style={couponText}>
              Kod: <strong style={{ letterSpacing: '2px' }}>{couponCode}</strong>
            </Text>
            <Text style={couponExpiry}>Ważny 14 dni.</Text>
          </Section>

          <Button style={button} href={returnUrl}>
            Wracam do treningów →
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Nudge AI Coach · Możesz zrezygnować z tych emaili, odpowiadając &quot;wypisz&quot;.
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
const progressCard = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const progressLabel = { fontSize: '12px', color: '#6b7280', margin: '0 0 4px' }
const progressNote = { fontSize: '15px', color: '#111827', fontWeight: '600', margin: '0' }
const discountBox = {
  backgroundColor: '#fff7ed',
  border: '1px dashed #fb923c',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
  textAlign: 'center' as const,
}
const discountHeadline = { fontSize: '15px', color: '#111827', margin: '0 0 8px' }
const couponText = { fontSize: '20px', color: '#ea580c', margin: '0 0 4px' }
const couponExpiry = { fontSize: '12px', color: '#9ca3af', margin: '0' }
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
const hr = { borderColor: '#e5e7eb', margin: '24px 0' }
const footer = { fontSize: '12px', color: '#9ca3af' }

export default InactivityD60Email
