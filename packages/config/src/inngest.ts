function readOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function resolveInngestEnvironment(
  input: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return readOptional(input['INNGEST_ENV']) ?? readOptional(input['VERCEL_GIT_COMMIT_REF'])
}
