"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      
      if (event === 'SIGNED_OUT') {
        // Optional: Redirect to home page on sign out
        window.location.href = '/'
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/kits', label: 'Kits' },
  ]

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error('Sign in error:', error.message)
        // Optional: Show error to user via toast notification
      }
    } catch (error) {
      console.error('Unexpected error during sign in:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error.message)
        // Optional: Show error to user via toast notification
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error)
    }
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 container mx-auto">
        <div className="flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary',
                pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {isLoading ? (
            <div className="h-9 w-[120px] animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <>
              <Button asChild variant="ghost" className="text-sm font-medium">
                <Link href="/profile">
                  {user.email?.split('@')[0] ?? 'Profile'}
                </Link>
              </Button>
              <Button 
                onClick={handleSignOut} 
                variant="ghost" 
                className="text-sm font-medium"
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleSignIn} 
              className="text-sm font-medium"
            >
              Sign In with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}