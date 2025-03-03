'use client'

import Link from 'next/link'
import { useTranslationClient } from '@/hooks/use-translation-client'

interface FooterProps {
  locale: string;
}

export function Footer({ locale }: FooterProps) {
  const { t, isReady } = useTranslationClient(locale)

  // Show skeleton loading state while translations are loading
  if (!isReady) {
    return (
      <footer className="border-t mt-auto">
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center">
            <div className="h-4 w-48 bg-gray-200 animate-pulse rounded" />
            <div className="flex space-x-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-4 w-16 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="border-t mt-auto">
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            © {new Date().getFullYear()} {t('footer.copyright')}
          </div>
          <div className="flex space-x-6">
            <a 
              href="https://github.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              GitHub
            </a>
            <Link 
              href={`/${locale}/terms`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {t('footer.terms')}
            </Link>
            <Link 
              href={`/${locale}/privacy`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {t('footer.privacy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}