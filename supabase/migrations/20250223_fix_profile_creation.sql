-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_user_profile(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS debug_create_profile(UUID, TEXT, TEXT);

-- Create a simple procedure that bypasses RLS
CREATE OR REPLACE PROCEDURE insert_profile(
    user_id UUID,
    display_name TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Run with elevated privileges
SET search_path = public -- Prevent search path injection
AS $$
BEGIN
    INSERT INTO user_profiles (id, display_name, avatar_url)
    VALUES (user_id, display_name, avatar_url);
    COMMIT;
END;
$$;

-- Ensure RLS is enabled
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for users matching their auth id" ON user_profiles;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for users matching their auth id" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::uuid = id);

CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid()::uuid = id)
    WITH CHECK (auth.uid()::uuid = id);