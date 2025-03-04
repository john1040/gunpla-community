'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { languages } from '@/i18n/settings'
import { useTranslationClient } from '@/hooks/use-translation-client'
import { usePathname } from 'next/navigation'

interface LanguageSwitcherProps {
  locale: string;
}

export function LanguageSwitcher({ locale }: LanguageSwitcherProps) {
  const { t, isReady } = useTranslationClient(locale)

  const pathname = usePathname()
  
  const redirectedPathname = (targetLocale: string) => {
    // Replace the locale segment in the pathname
    const segments = pathname.split('/')
    segments[1] = targetLocale
    return segments.join('/')
  }

  // Show skeleton loading state while translations are loading
  if (!isReady) {
    return (
      <div className="relative">
        <div className="h-9 w-[120px] animate-pulse rounded-md bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="relative group">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span>{t('language.select')}</span>
      </Button>
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
        <div className="py-1">
          {languages.map((lang) => {
            const isActive = locale === lang
            return (
              <Link
                key={lang}
                href={redirectedPathname(lang)}
                className={`block px-4 py-2 text-sm hover:bg-gray-50 ${
                  isActive ? 'bg-gray-100 font-medium' : ''
                }`}
              >
                {t(`language.${lang}`)}
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}