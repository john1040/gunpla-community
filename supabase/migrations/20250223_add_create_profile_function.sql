-- Create a function to handle user profile creation with elevated privileges
CREATE OR REPLACE FUNCTION create_user_profile(
    user_id UUID,
    user_display_name TEXT,
    user_avatar_url TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- This makes the function run with elevated privileges
SET search_path = public -- This prevents search_path injection
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (user_id, user_display_name, user_avatar_url);
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;