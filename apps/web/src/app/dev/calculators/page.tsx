import { notFound } from 'next/navigation'
import { env } from '@/lib/env'
import { CalculatorsSandbox } from './CalculatorsSandbox'

export default function CalculatorsSandboxPage() {
  if (!env.NEXT_PUBLIC_DEV_MODE) {
    notFound()
  }

  return <CalculatorsSandbox />
}
