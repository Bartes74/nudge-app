import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { GuardrailBlock } from './GuardrailBlock'

const meta = {
  title: 'Onboarding/GuardrailBlock',
  component: GuardrailBlock,
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} satisfies Meta<typeof GuardrailBlock>

export default meta
type Story = StoryObj<typeof meta>

export const Underage: Story = {
  args: { reason: 'underage' },
}

export const Pregnancy: Story = {
  args: { reason: 'pregnancy' },
}
