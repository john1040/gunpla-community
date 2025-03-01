-- Ensure the bucket exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT 'profiles', 'profiles', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
WHERE NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'profiles'
);

-- Drop existing policies
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar update policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar view policy" ON storage.objects;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Secure upload policy - users can only upload to their own avatar path
CREATE POLICY "Avatar upload policy"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND position(auth.uid()::text in name) > 0
);

-- Secure update policy - users can only update their own avatars
CREATE POLICY "Avatar update policy"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND position(auth.uid()::text in name) > 0
);

-- Secure delete policy - users can only delete their own avatars
CREATE POLICY "Avatar delete policy"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles'
    AND (storage.foldername(name))[1] = 'avatars'
    AND position(auth.uid()::text in name) > 0
);

-- Public view policy - anyone can view avatars
CREATE POLICY "Avatar view policy"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- Grant necessary permissions
GRANT ALL ON storage.objects TO postgres, service_role;
GRANT ALL ON storage.buckets TO postgres, service_role;

GRANT SELECT ON storage.objects TO public;
GRANT SELECT ON storage.buckets TO public;

GRANT INSERT, SELECT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT SELECT ON storage.buckets TO authenticated;