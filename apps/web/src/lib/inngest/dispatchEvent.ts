import * as Sentry from '@sentry/nextjs'
import { inngest } from '@/inngest/client'

type SendEventInput = Parameters<typeof inngest.send>[0]

export type InngestDispatchErrorCode =
  | 'missing_branch_environment'
  | 'dispatch_failed'

export class InngestDispatchError extends Error {
  readonly code: InngestDispatchErrorCode

  constructor(
    code: InngestDispatchErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options)
    this.name = 'InngestDispatchError'
    this.code = code
  }
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return 'Unknown Inngest error'
}

function toDispatchError(error: unknown): InngestDispatchError {
  const message = readErrorMessage(error)

  if (message.includes('Branch environment does not exist')) {
    return new InngestDispatchError(
      'missing_branch_environment',
      'Missing Inngest branch environment for this deployment.',
      { cause: error },
    )
  }

  return new InngestDispatchError('dispatch_failed', message, { cause: error })
}

export async function dispatchInngestEvent(event: SendEventInput) {
  try {
    return await inngest.send(event)
  } catch (error) {
    const dispatchError = toDispatchError(error)

    Sentry.captureException(error, {
      tags: {
        subsystem: 'inngest',
        code: dispatchError.code,
      },
      extra: {
        event,
      },
    })

    throw dispatchError
  }
}
