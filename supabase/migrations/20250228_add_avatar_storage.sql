-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create a new storage bucket for profile avatars if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'profiles'
    ) THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('profiles', 'profiles', true);
    END IF;
END $$;

-- Allow authenticated users to upload files to the profiles bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = 'avatars' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow public access to view avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = 'avatars');