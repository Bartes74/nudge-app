'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { pl } from './locales/pl'

const resources = {
  pl: {
    translation: pl,
  },
} as const

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'pl',
    fallbackLng: 'pl',
    interpolation: {
      escapeValue: false, // React already handles XSS
    },
    // i18n-ready: add more locales here in future iterations
    supportedLngs: ['pl'],
  })
}

export default i18n
