-- Add INSERT policy for user_profiles
CREATE POLICY "Enable insert for users matching their auth id" ON user_profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);