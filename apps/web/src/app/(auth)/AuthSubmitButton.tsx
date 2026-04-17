'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import type { ComponentProps } from 'react'

export function AuthSubmitButton({
  children,
  ...props
}: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" isLoading={pending} {...props}>
      {children}
    </Button>
  )
}
