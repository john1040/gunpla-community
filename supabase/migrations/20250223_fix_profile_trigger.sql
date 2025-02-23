-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS acount ON user_profiles CASCADE;

-- Drop the function after removing dependent triggers
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create an enhanced trigger function with debugging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_profiles 
        WHERE id = new.id
    ) INTO profile_exists;

    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO public.user_profiles (
            id,
            display_name,
            avatar_url
        ) VALUES (
            new.id,
            COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
            new.raw_user_meta_data->>'avatar_url'
        );
    END IF;

    RETURN new;
END;
$$;

-- Recreate the auth trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Add a manual function to force profile creation
CREATE OR REPLACE FUNCTION public.force_create_profile(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record auth.users%ROWTYPE;
BEGIN
    -- Get the user record from auth.users
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE id = user_id;

    IF user_record IS NULL THEN
        RAISE EXCEPTION 'User not found in auth.users';
        RETURN false;
    END IF;

    -- Execute the same logic as the trigger
    INSERT INTO public.user_profiles (
        id,
        display_name,
        avatar_url
    ) VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)),
        user_record.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        display_name = EXCLUDED.display_name,
        avatar_url = EXCLUDED.avatar_url;

    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error in force_create_profile: %', SQLERRM;
    RETURN false;
END;
$$;