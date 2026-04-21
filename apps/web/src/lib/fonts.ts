import { Inter, JetBrains_Mono, Lora, Outfit, Playfair_Display } from 'next/font/google'

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

export const fontWordmarkSans = Outfit({
  subsets: ['latin', 'latin-ext'],
  weight: ['100', '400', '700', '900'],
  variable: '--font-wordmark-sans',
  display: 'swap',
})
