import type { Config } from 'tailwindcss'

/**
 * Nudge design tokens as a Tailwind CSS preset.
 * Colors reference CSS variables defined in globals.css.
 * Add `presets: [nudgeTailwindPreset]` to any app's tailwind.config.ts.
 */
export const nudgeTailwindPreset = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — mapped to CSS variables
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Layered surfaces — used by cards and chips for quiet depth
        surface: {
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
        },
        // Nudge-specific brand tokens
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          foreground: 'hsl(var(--brand-foreground))',
          muted: 'hsl(var(--brand-muted))',
        },
        // Electric lime — used exclusively for data-positive / high-signal moments
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Editorial display scale — use with font-display for serif effect
        'display-xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em' }],
        'display-l': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        'display-m': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        // Body scale — Inter Tight
        'body-l': ['1.0625rem', { lineHeight: '1.55' }],
        'body-m': ['0.9375rem', { lineHeight: '1.5' }],
        'body-s': ['0.8125rem', { lineHeight: '1.4' }],
        // Meta / eyebrow labels
        'label': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
        // Tabular mono metrics
        'data-xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '500' }],
        'data-l': ['2rem', { lineHeight: '1.05', letterSpacing: '-0.015em', fontWeight: '500' }],
      },
      transitionTimingFunction: {
        premium: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backgroundImage: {
        // Hero radial glow — brand warmth, used on hero cards
        'gradient-hero':
          'radial-gradient(120% 80% at 0% 0%, hsl(var(--brand) / 0.18) 0%, transparent 55%), radial-gradient(80% 60% at 100% 100%, hsl(var(--brand) / 0.08) 0%, transparent 55%)',
        // Subtle noise texture (feTurbulence) — overlays surfaces for tactile feel
        'grain':
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
      },
      boxShadow: {
        'lift-sm': '0 1px 2px 0 hsl(var(--foreground) / 0.04), 0 1px 1px 0 hsl(var(--foreground) / 0.02)',
        'lift': '0 4px 16px -4px hsl(var(--foreground) / 0.08), 0 2px 4px -2px hsl(var(--foreground) / 0.04)',
        'lift-lg': '0 12px 40px -8px hsl(var(--foreground) / 0.14), 0 4px 12px -4px hsl(var(--foreground) / 0.06)',
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
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'rise-in': 'rise-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
} satisfies Partial<Config>
