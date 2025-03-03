import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { languages, fallbackLng } from './i18n/settings'

// Match all paths except public files and API routes
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the pathname already includes a locale
  const pathnameHasLocale = languages.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // Get user's preferred language
  let locale = languages.find((locale) =>
    request.headers
      .get('accept-language')
      ?.toLowerCase()
      .startsWith(locale.toLowerCase())
  )

  if (!locale) locale = fallbackLng

  // For "/" path, redirect to /locale/
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${locale}`, request.url))
  }

  // For other paths, rewrite to add the locale prefix
  return NextResponse.rewrite(
    new URL(`/${locale}${pathname}${request.nextUrl.search}`, request.url)
  )
}