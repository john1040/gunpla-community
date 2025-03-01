-- Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
SELECT 'profiles', 'profiles', true
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profiles'
);

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create storage policies
CREATE POLICY "Avatar upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND owner_id = auth.uid()::text
    AND owner = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Avatar update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles'
    AND owner_id = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND owner_id = auth.uid()::text
    AND owner = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Avatar delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles'
    AND owner_id = auth.uid()::text
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Avatar view policy"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Add default owner values for storage.objects
-- Set proper column defaults
ALTER TABLE storage.objects
ALTER COLUMN owner SET DEFAULT (SELECT email FROM auth.users WHERE id = auth.uid()),
ALTER COLUMN owner_id SET DEFAULT auth.uid()::text;

-- Fix the owner lookup in policies by ensuring proper type casting
CREATE OR REPLACE FUNCTION storage.get_owner_email()
RETURNS TEXT AS $$
  SELECT email::text
  FROM auth.users
  WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop and recreate the policies with proper type handling
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar view policy" ON storage.objects;

CREATE POLICY "Avatar upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND owner_id = auth.uid()::text
    AND owner = storage.get_owner_email()
);

CREATE POLICY "Avatar update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles'
    AND owner_id = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
    AND owner_id = auth.uid()::text
    AND owner = storage.get_owner_email()
);

CREATE POLICY "Avatar delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles'
    AND owner_id = auth.uid()::text
    AND (storage.foldername(name))[1] = 'avatars'
    AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Avatar view policy"
ON storage.objects
FOR SELECT
TO public
USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO postgres, service_role;
GRANT ALL ON storage.buckets TO postgres, service_role;

GRANT SELECT ON storage.objects TO public;
GRANT SELECT ON storage.buckets TO public;

GRANT INSERT, SELECT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;