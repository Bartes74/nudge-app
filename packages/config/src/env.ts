import { z } from 'zod'

/**
 * Creates a validated, typed env object from process.env.
 * Crashes on startup with a clear message if required vars are missing.
 *
 * Set SKIP_ENV_VALIDATION=1 to bypass (CI builds only).
 */
export function createEnv<T extends z.ZodRawShape>(
  schema: T,
): z.infer<z.ZodObject<T>> {
  if (process.env['SKIP_ENV_VALIDATION'] === '1') {
    return process.env as unknown as z.infer<z.ZodObject<T>>
  }

  const result = z.object(schema).safeParse(process.env)

  if (!result.success) {
    const lines = result.error.issues
      .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
      .join('\n')

    throw new Error(
      `\n\nInvalid environment variables:\n${lines}\n\nCheck your .env.local (web) or .env (api).\n`,
    )
  }

  return result.data
}
