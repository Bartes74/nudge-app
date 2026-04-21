import { Inter, JetBrains_Mono, Lora, Playfair_Display } from 'next/font/google'

export const fontDisplay = Playfair_Display({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

export const fontEditorial = Lora({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-editorial',
  display: 'swap',
})

export const fontSans = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

export const fontMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-mono',
  display: 'swap',
})
