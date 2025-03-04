'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'

export function useTranslationClient(locale: string) {
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const { t, i18n } = useTranslation('common', { useSuspense: false })

  useEffect(() => {
    const initializeTranslation = async () => {
      if (i18n.isInitialized) {
        if (locale !== i18n.language) {
          await i18n.changeLanguage(locale)
        }
        if (isInitialLoad) {
          setIsInitialLoad(false)
        }
      }
    }

    initializeTranslation()
  }, [locale, i18n, isInitialLoad])

  // If it's initial load, return a placeholder translator
  if (isInitialLoad) {
    return {
      t: ((key: string) => key) as TFunction,
      i18n,
      isReady: false
    }
  }

  return { t, i18n, isReady: true }
}