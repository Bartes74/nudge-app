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

interface TrialD4Props {
  firstName: string
  primaryGoal: string
  experienceLevel: string
  workoutsPerWeek: number
  appUrl: string
}

export function TrialD4Email({
  firstName,
  primaryGoal,
  experienceLevel,
  workoutsPerWeek,
  appUrl,
}: TrialD4Props) {
  const goalLabels: Record<string, string> = {
    weight_loss: 'schudnięcie i poprawa kondycji',
    muscle_building: 'budowanie masy mięśniowej',
    general_health: 'ogólna poprawa zdrowia i samopoczucia',
    strength_performance: 'wzrost siły i wyniki sportowe',
    body_recomposition: 'rekompozysia — jednoczesna redukcja i budowanie',
  }

  const levelLabels: Record<string, string> = {
    zero: 'całkowity początkujący',
    beginner: 'początkujący',
    amateur: 'zaawansowany amator',
    intermediate: 'średniozaawansowany',
    advanced: 'zaawansowany',
  }

  const goalLabel = goalLabels[primaryGoal] ?? primaryGoal
  const levelLabel = levelLabels[experienceLevel] ?? experienceLevel

  return (
    <Html lang="pl">
      <Head />
      <Preview>Oto co Nudge już wie o Tobie, {firstName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Dzień 4 — oto co już wiemy o Tobie</Heading>

          <Text style={text}>Cześć, {firstName}!</Text>

          <Text style={text}>
            Minęły 4 dni Twojego trialu. Nudge zdążył Cię już trochę poznać. Oto co mamy:
          </Text>

          <Section style={profileCard}>
            <Text style={profileRow}>
              🎯 <strong>Twój cel:</strong> {goalLabel}
            </Text>
            <Text style={profileRow}>
              💪 <strong>Poziom:</strong> {levelLabel}
            </Text>
            <Text style={profileRow}>
              📅 <strong>Treningi w tygodniu:</strong> {workoutsPerWeek}x
            </Text>
          </Section>

          <Text style={text}>
            Na bazie tych danych Nudge dostosowuje każdy trening, każde pytanie o posiłek i
            każdy tygodniowy check-in. Im więcej logujesz — tym precyzyjniejszy coaching.
          </Text>

          <Text style={text}>
            Masz jeszcze 3 dni trialu. Wróć do aplikacji i sprawdź, jak idzie plan.
          </Text>

          <Button style={button} href={appUrl}>
            Otwórz Nudge →
          </Button>

          <Hr style={hr} />

          <Text style={footer}>
            Nudge AI Coach · Dane zachowane zawsze, nawet jeśli nie przedłużysz.
            Jeśli masz pytania — odpowiedz na tego emaila.
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
const profileCard = {
  backgroundColor: '#f0fdf4',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
}
const profileRow = { fontSize: '14px', color: '#111827', margin: '4px 0' }
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

export default TrialD4Email
