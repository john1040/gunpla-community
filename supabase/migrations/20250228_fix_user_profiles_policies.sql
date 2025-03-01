-- Add insert policy for user_profiles
CREATE POLICY "Enable insert for users based on id" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Drop and recreate update policy to ensure it's working
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);