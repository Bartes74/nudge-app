import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface PostCancellationD1Props {
  firstName: string
  returnUrl: string
}

export function PostCancellationD1Email({ firstName, returnUrl }: PostCancellationD1Props) {
  return (
    <Html lang="pl">
      <Head />
      <Preview>Twoje dane są bezpieczne, {firstName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Wróć kiedy będziesz gotowy/a</Heading>

          <Text style={text}>Cześć, {firstName}!</Text>

          <Text style={text}>
            Anulowałeś/aś subskrypcję Nudge. Rozumiemy — czasem przerwa jest potrzebna.
          </Text>

          <Text style={text}>
            <strong>Twoje dane są zachowane przez co najmniej 30 dni.</strong> Treningi,
            historia, profil — wszystko będzie na Ciebie czekać.
          </Text>

          <Text style={text}>
            Jeśli zechcesz wrócić, wystarczy kliknąć poniżej — i zaczynasz dokładnie tam,
            gdzie skończyłeś/aś. Bez utraty postępów, bez konfiguracji od zera.
          </Text>

          <Button style={button} href={returnUrl}>
            Wróć do Nudge →
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Nudge AI Coach · Masz feedback, dlaczego odchodzisz? Odpowiedz na tego emaila
            — czytamy każdą wiadomość.
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

export default PostCancellationD1Email
