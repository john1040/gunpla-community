import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../globals.css'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Toaster } from '@/components/ui/toaster'
import { QueryProvider } from '@/providers/query-provider'
import { languages } from '@/i18n/settings'
import I18nClientProvider from '@/providers/i18n-client-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gunpla Community',
  description: 'A community platform for Gunpla enthusiasts',
}

// Generate static params for all supported languages
export async function generateStaticParams() {
  return languages.map((locale) => ({ locale }))
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params?: Promise<{ locale?: string }> // Mark params as optional
}) {
  const locale = (await params)?.locale || 'en'; // Fallback to 'en' if undefined

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <I18nClientProvider locale={locale}>
          <div className="relative flex min-h-screen flex-col">
            <QueryProvider>
              <Navbar locale={locale} />
              <main className="flex-1">{children}</main>
              <Footer locale={locale} />
              <Toaster />
            </QueryProvider>
          </div>
        </I18nClientProvider>
      </body>
    </html>
  )
}

