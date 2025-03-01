-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for users matching their auth id" ON user_profiles;
DROP POLICY IF EXISTS "Enable update for own profile" ON user_profiles;
DROP POLICY IF EXISTS "Enable insert for own profile" ON user_profiles;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies with explicit permissions
CREATE POLICY "Enable read access for all users"
    ON user_profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Enable update for own profile"
    ON user_profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE POLICY "Enable insert for own profile"
    ON user_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (id = auth.uid());

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop and recreate trigger function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Set permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_profiles TO postgres;
GRANT SELECT ON user_profiles TO anon, authenticated;
GRANT UPDATE, INSERT ON user_profiles TO authenticated;