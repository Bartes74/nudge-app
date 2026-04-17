import { Resend } from 'resend'
import { render } from '@react-email/render'
import { env } from '../lib/env.js'
import type { ReactElement } from 'react'

const resend = new Resend(env.RESEND_API_KEY)

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string
  subject: string
  template: ReactElement
}): Promise<void> {
  const html = await render(template)

  const { error } = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to,
    subject,
    html,
  })

  if (error) {
    throw new Error(`sendEmail failed: ${error.message}`)
  }
}
