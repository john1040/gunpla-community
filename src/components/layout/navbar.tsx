'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { useTranslationClient } from '@/hooks/use-translation-client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { queries, mutations } from '@/utils/queries'
import { toast } from '@/components/ui/use-toast'
import { LanguageSwitcher } from './language-switcher'
import { Menu } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useState } from 'react'

interface NavbarProps {
  children?: React.ReactNode;
  locale: string;
}

export function Navbar({ locale }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const { t, isReady } = useTranslationClient(locale)

  // Query for current user session
  const { data: session } = useQuery(queries.session)

  // Query for user profile when session exists
  const { data: profile, isLoading: isProfileLoading } = useQuery(
    queries.userProfile(session?.user?.id)
  )

  // Set up auth state change listener
  useQuery(queries.authListener(queryClient, locale))

  // Sign in mutation
  const signInMutation = useMutation({
    ...mutations.signIn,
    onError: (error: Error) => {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Sign out mutation
  const signOutMutation = useMutation({
    ...mutations.signOut,
    onError: (error: Error) => {
      toast({
        title: t('auth.error'),
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const navItems = [
    { href: `/${locale}`, label: 'navigation.home' },
    { href: `/${locale}/kits`, label: 'navigation.kits' }
  ]

  // Function to check if a nav item is active
  const isNavItemActive = (href: string) => {
    const currentPath = pathname || ''
    // For home page
    if (href === `/${locale}`) {
      return currentPath === href
    }
    // For other pages, check if pathname starts with the href
    return currentPath.startsWith(href)
  }

  // Show skeleton loading state while translations are loading
  if (!isReady) {
    return (
      <nav className="border-b">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <div className="md:flex hidden items-center space-x-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-4 w-20 bg-gray-200 animate-pulse rounded" />
            ))}
          </div>
          <div className="md:hidden">
            <div className="h-8 w-8 bg-gray-200 animate-pulse rounded" />
          </div>
          <div className="ml-auto">
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle>{t('navigation.menu')}</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      isNavItemActive(item.href) ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {t(item.label)}
                  </Link>
                ))}
                {session?.user && (
                  <Link
                    href={`/${locale}/profile`}
                    onClick={() => setIsOpen(false)}
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                  >
                    {profile?.display_name || t('navigation.profile')}
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                isNavItemActive(item.href) ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {t(item.label)}
            </Link>
          ))}
        </div>

        {/* Right Side Items (Language + Auth) */}
        <div className="ml-auto flex items-center space-x-4">
          <LanguageSwitcher locale={locale} />
          {isProfileLoading ? (
            <div className="h-9 w-[120px] animate-pulse rounded-md bg-muted" />
          ) : session?.user ? (
            <>
              <Button asChild variant="ghost" className="text-sm font-medium hidden md:inline-flex">
                <Link href={`/${locale}/profile`}>
                  {profile?.display_name || t('navigation.profile')}
                </Link>
              </Button>
              <Button
                onClick={() => signOutMutation.mutate()}
                variant="ghost"
                className="text-sm font-medium"
              >
                {t('auth.signOut')}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => signInMutation.mutate(locale)}
              className="text-sm font-medium"
            >
              {t('auth.signIn')}
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}