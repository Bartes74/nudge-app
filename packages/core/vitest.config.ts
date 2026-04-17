import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/rules/bmr.ts',
        'src/rules/tdee.ts',
        'src/rules/macros.ts',
        'src/rules/volume.ts',
        'src/rules/progression.ts',
        'src/rules/guardrails/**/*.ts',
        'src/rules/calculateAgeBucket.ts',
        'src/rules/classifySegment.ts',
        'src/signals/updateBehaviorSignals.ts',
      ],
      exclude: [
        'src/rules/**/*.test.ts',
        'src/rules/__tests__/**',
        'src/signals/**/*.test.ts',
        'src/signals/__tests__/**',
      ],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      reporter: ['text', 'lcov'],
    },
  },
})
