import { type FastifyInstance } from 'fastify'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { version } = require('../../package.json') as { version: string }

export async function healthRoute(fastify: FastifyInstance) {
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      version,
      timestamp: new Date().toISOString(),
    }
  })
}
