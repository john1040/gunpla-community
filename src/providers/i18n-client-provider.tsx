'use client'

import { useEffect } from 'react'
import i18n from '@/i18n/client'

export default function I18nClientProvider({
  children,
  locale
}: {
  children: React.ReactNode
  locale: string
}) {
  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale)
    }
  }, [locale])

  return <>{children}</>
}