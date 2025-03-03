import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  // Get the code and next path from the URL
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'
  
  if (code) {
    // Create client with cookies
    const supabase = await createClient()
    
    // Exchange code for session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // URL object requires absolute URLs
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.url
      return NextResponse.redirect(new URL(next, baseUrl))
    }
  }

  // Return the user to an error page with some instructions
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.url
  return NextResponse.redirect(new URL('/auth/auth-code-error', baseUrl))
}