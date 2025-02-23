import { SupabaseClient } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface ProfileResult {
  profile?: UserProfile;
  error?: string;
  details?: any;
  isNewProfile?: boolean;
}

export async function ensureUserProfile(supabase: SupabaseClient): Promise<ProfileResult> {
  try {
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('No authenticated user found:', userError);
      return { error: 'Authentication error', details: userError };
    }
    
    if (!user?.id) {
      console.error('No user ID in auth response');
      return { error: 'No user ID found' };
    }

    console.log('Checking profile for user:', user.id);

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      return { profile, isNewProfile: false };
    }

    console.log('No profile found, forcing profile creation...');

    // Profile doesn't exist, force create it
    const { data: created, error: createError } = await supabase
      .rpc('force_create_profile', {
        user_id: user.id
      });

    if (createError) {
      console.error('Failed to force create profile:', createError);
      return { error: 'Profile creation failed', details: createError };
    }

    if (!created) {
      return { error: 'Profile creation returned false' };
    }

    // Fetch the newly created profile
    const { data: newProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (fetchError || !newProfile) {
      console.error('Failed to fetch created profile:', fetchError);
      return { error: 'Profile fetch failed', details: fetchError };
    }

    console.log('Successfully created profile:', newProfile);
    return { profile: newProfile, isNewProfile: true };
  } catch (error) {
    console.error('Unexpected error in ensureUserProfile:', error);
    return { error: 'Unexpected error', details: error };
  }
}