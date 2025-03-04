'use client'

import { useEffect, useState } from 'react'
import i18n from '@/i18n/client'
import { I18nextProvider } from 'react-i18next'

export default function I18nClientProvider({
  children,
  locale
}: {
  children: React.ReactNode
  locale: string
}) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const initI18n = async () => {
      if (!i18n.isInitialized) {
        await i18n.init()
      }
      if (i18n.language !== locale) {
        await i18n.changeLanguage(locale)
      }
      setIsInitialized(true)
    }

    initI18n()
  }, [locale])

  if (!isInitialized) {
    return null // Or a loading spinner
  }

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}