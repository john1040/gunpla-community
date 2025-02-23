import { createClient } from "@/utils/supabase/server";
import { ensureUserProfile } from "@/utils/supabase/ensure-profile";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError);
      return NextResponse.redirect(`${origin}/error`);
    }

    if (user) {
      // Ensure user profile exists
      const result = await ensureUserProfile(supabase);
      if ('error' in result) {
        console.error('Failed to ensure user profile exists:', result.error, result.details);
      } else {
        console.log('Profile ensured:', result.profile);
        if (result.isNewProfile) {
          // Redirect new users to onboarding
          return NextResponse.redirect(`${origin}/onboarding`);
        }
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}/`);
}