import type { Config } from 'tailwindcss'

/**
 * Nudge design tokens as a Tailwind CSS preset.
 * Colors reference CSS variables defined in globals.css.
 * Add `presets: [nudgeTailwindPreset]` to any app's tailwind.config.ts.
 */
export const nudgeTailwindPreset = {
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-canvas)',
        foreground: 'var(--fg-primary)',
        card: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--fg-primary)',
        },
        popover: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--fg-primary)',
        },
        primary: {
          DEFAULT: 'var(--action-primary-bg)',
          foreground: 'var(--action-primary-fg)',
        },
        secondary: {
          DEFAULT: 'var(--bg-inset)',
          foreground: 'var(--fg-primary)',
        },
        muted: {
          DEFAULT: 'var(--bg-inset)',
          foreground: 'var(--fg-secondary)',
        },
        accent: {
          DEFAULT: 'var(--bg-inset)',
          foreground: 'var(--fg-primary)',
        },
        destructive: {
          DEFAULT: 'var(--status-caution)',
          foreground: 'var(--oatmeal-50)',
        },
        border: 'var(--border-subtle)',
        input: 'var(--border-subtle)',
        ring: 'var(--border-strong)',
        surface: {
          1: 'var(--bg-surface)',
          2: 'var(--bg-inset)',
          3: 'var(--bg-elevated)',
        },
        brand: {
          DEFAULT: 'var(--status-premium)',
          foreground: 'var(--oatmeal-50)',
          muted: 'var(--copper-50)',
        },
        success: {
          DEFAULT: 'var(--status-success)',
          foreground: 'var(--oatmeal-50)',
        },
        warning: {
          DEFAULT: 'var(--status-caution)',
          foreground: 'var(--oatmeal-50)',
        },
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        pill: 'var(--radius-pill)',
        full: 'var(--radius-pill)',
      },
      spacing: {
        0: 'var(--space-0)',
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
        24: 'var(--space-24)',
        32: 'var(--space-32)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        editorial: ['var(--font-editorial)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xl': ['clamp(56px, 9vw, 120px)', { lineHeight: '0.98', letterSpacing: '-0.03em' }],
        'display-l': ['48px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-m': ['36px', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
        'display-s': ['28px', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'body-l': ['var(--text-lg)', { lineHeight: 'var(--leading-relaxed)' }],
        'body-m': ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        'body-s': ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        label: ['10px', { lineHeight: '1.3', letterSpacing: 'var(--tracking-wider)', fontWeight: '400' }],
        'data-xl': ['48px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'data-l': ['36px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '500' }],
      },
      transitionTimingFunction: {
        premium: 'var(--ease-soft)',
      },
      transitionDuration: {
        premium: 'var(--dur-fast)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        ambient: 'var(--shadow-ambient)',
        'lift-sm': 'var(--shadow-sm)',
        lift: 'var(--shadow-md)',
        'lift-lg': 'var(--shadow-lg)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
} satisfies Partial<Config>
