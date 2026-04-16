import type { Config } from 'tailwindcss'
import { nudgeTailwindPreset } from '@nudge/config/tailwind-preset'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  presets: [nudgeTailwindPreset as unknown as Config],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [tailwindcssAnimate],
}

export default config
