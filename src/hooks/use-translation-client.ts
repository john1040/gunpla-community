'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export function useTranslationClient(locale: string) {
  const [isReady, setIsReady] = useState(false)
  const { t, i18n } = useTranslation('common', { useSuspense: false })

  useEffect(() => {
    const initializeTranslation = async () => {
      if (i18n.isInitialized) {
        if (locale !== i18n.language) {
          await i18n.changeLanguage(locale)
        }
        setIsReady(true)
      }
    }

    initializeTranslation()
  }, [locale, i18n])

  if (!isReady) {
    return {
      t: ((key: string) => key) as TFunction,
      i18n,
      isReady
    }
  }

  return { t, i18n, isReady }
}