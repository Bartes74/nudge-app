import { buildApp } from './app.ts'
import { env } from './lib/env.ts'

const app = buildApp()

app.listen({ port: env.PORT, host: '0.0.0.0' }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
