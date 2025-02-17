'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
      }
    )

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/kits', label: 'Kits' },
  ]

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
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
          {user ? (
            <>
              <Link href="/profile">
                <Button variant="ghost" className="text-sm font-medium">
                  Profile
                </Button>
              </Link>
              <Button onClick={handleSignOut} variant="ghost" className="text-sm font-medium">
                Sign Out
              </Button>
            </>
          ) : (
            <Button onClick={handleSignIn} className="text-sm font-medium">
              Sign In with Google
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}