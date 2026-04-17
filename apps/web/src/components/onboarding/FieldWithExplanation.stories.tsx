import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { FieldWithExplanation } from './FieldWithExplanation'
import { Input } from '../ui/input'

const meta = {
  title: 'Onboarding/FieldWithExplanation',
  component: FieldWithExplanation,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof FieldWithExplanation>

export default meta
type Story = StoryObj<typeof meta>

export const WithFullExplanation: Story = {
  args: {
    label: 'Aktualna masa ciała (kg)',
    required: false,
    explanation: {
      why_we_ask: 'Masa ciała to punkt startowy do planu żywieniowego i treningowego.',
      how_to_measure: 'Zważ się rano na czczo lub podaj orientacyjną wartość.',
      example: 'np. 72',
    },
    children: <Input type="number" placeholder="np. 72" />,
  },
}

export const RequiredField: Story = {
  args: {
    label: 'Jaki jest Twój główny cel?',
    required: true,
    explanation: {
      why_we_ask: 'Cel główny wyznacza cały kierunek planu.',
      how_to_measure: 'Zastanów się, co chcesz osiągnąć w ciągu 3 miesięcy.',
    },
    children: <Input placeholder="Wybierz cel" />,
  },
}

export const WithoutExplanation: Story = {
  args: {
    label: 'Jesteś w ciąży?',
    required: false,
    explanation: null,
    children: <Input type="text" placeholder="Tak / Nie" />,
  },
}

export const ExplanationOpen: Story = {
  args: {
    label: 'Wzrost (cm)',
    required: false,
    explanation: {
      why_we_ask: 'Wzrost służy do obliczenia BMI i TDEE.',
      how_to_measure: 'Stań bez butów. Wystarczy przybliżona wartość.',
      example: 'np. 172',
    },
    children: <Input type="number" placeholder="np. 172" />,
  },
  play: async ({ canvas }) => {
    // Auto-open explanation for visual snapshot
    const btn = canvas.getByRole('button', { name: /wyjaśnienie/i })
    await btn.click()
  },
}
