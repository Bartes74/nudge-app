import { z } from 'zod'

/**
 * Creates a lazily-validated, typed env object from process.env.
 * Validation runs on first property access (not at module import time),
 * so Next.js page data collection workers don't blow up before any request
 * context exists.
 *
 * Set SKIP_ENV_VALIDATION=1 to bypass validation entirely (CI builds).
 */
export function createEnv<T extends z.ZodRawShape>(
  schema: T,
): z.infer<z.ZodObject<T>> {
  let cache: z.infer<z.ZodObject<T>> | undefined

  function get(): z.infer<z.ZodObject<T>> {
    if (cache !== undefined) return cache

    if (process.env['SKIP_ENV_VALIDATION'] === '1') {
      cache = process.env as unknown as z.infer<z.ZodObject<T>>
      return cache
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

    cache = result.data
    return cache
  }

  return new Proxy({} as z.infer<z.ZodObject<T>>, {
    get(_, key: string | symbol) {
      if (typeof key !== 'string') return undefined
      return get()[key as keyof z.infer<z.ZodObject<T>>]
    },
  })
}
