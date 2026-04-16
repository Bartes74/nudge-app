'use client'

import '@/lib/i18n/config'
import { useTranslation } from 'react-i18next'
import type { PL } from './locales/pl'

/**
 * Typed wrapper around react-i18next's `useTranslation`.
 * Ensures `t()` keys are validated against the Polish locale shape.
 */
export function useT() {
  return useTranslation<'translation', keyof PL>()
}
