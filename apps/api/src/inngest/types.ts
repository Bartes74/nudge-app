export type ApiStepTools = {
  run<T>(id: string, fn: () => Promise<T>): Promise<T>
  sleep(id: string, duration: string): Promise<void>
}

export type ApiEventContext<TEventData extends Record<string, unknown>> = {
  event: { data: TEventData }
  step: ApiStepTools
}

export type ApiCronContext = {
  step: ApiStepTools
}
