import { type FastifyInstance } from 'fastify'

// pnpm sets npm_package_version from package.json at runtime
const VERSION = process.env['npm_package_version'] ?? '0.0.0'

export function healthRoute(fastify: FastifyInstance) {
  fastify.get('/health', () => ({
    status: 'ok',
    version: VERSION,
    timestamp: new Date().toISOString(),
  }))
}
