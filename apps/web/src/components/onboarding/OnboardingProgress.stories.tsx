import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { OnboardingProgress } from './OnboardingProgress'

const meta = {
  title: 'Onboarding/OnboardingProgress',
  component: OnboardingProgress,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof OnboardingProgress>

export default meta
type Story = StoryObj<typeof meta>

export const Start: Story = { args: { current: 1, total: 11 } }
export const Middle: Story = { args: { current: 6, total: 11 } }
export const AlmostDone: Story = { args: { current: 10, total: 11 } }
export const Complete: Story = { args: { current: 11, total: 11 } }
