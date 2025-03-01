# Fix Avatar Storage Policies Plan

## Problem
The avatar upload functionality is failing due to missing storage policies in the Supabase profiles bucket. While the policies were defined in our migrations, they seem to not have been applied properly.

## Required Storage Policies

We need to ensure the following policies are properly set up for the profiles bucket:

1. **Avatar Upload Policy**
   - FOR: INSERT
   - TO: authenticated
   - WITH CHECK conditions:
     - bucket_id = 'profiles'
     - folder path is avatars/{user_id}
     - owner_id matches auth.uid()
     - owner matches user's email

2. **Avatar Update Policy**
   - FOR: UPDATE
   - TO: authenticated
   - Using AND WITH CHECK conditions:
     - bucket_id = 'profiles'
     - folder path is avatars/{user_id}
     - owner_id matches auth.uid()
     - owner matches user's email

3. **Avatar Delete Policy**
   - FOR: DELETE
   - TO: authenticated
   - USING conditions:
     - bucket_id = 'profiles'
     - folder path is avatars/{user_id}
     - owner_id matches auth.uid()

4. **Avatar View Policy**
   - FOR: SELECT
   - TO: public
   - USING conditions:
     - bucket_id = 'profiles'
     - folder path starts with avatars/

## Implementation Steps

1. Create a new migration file: `20250301_fix_avatar_storage_policies.sql`
2. Drop any existing storage policies to start fresh
3. Ensure RLS is enabled on storage.objects
4. Create all four policies with proper conditions
5. Set proper default values for owner and owner_id columns
6. Create helper function for getting owner email
7. Grant necessary permissions to roles

## Testing Plan

After implementing these changes, we should test:
1. Uploading a new avatar
2. Updating an existing avatar
3. Deleting an avatar
4. Viewing avatars (both authenticated and public access)

## Migration Rollback Plan

In case of issues, we can:
1. Keep a backup of any existing policies before dropping them
2. Create a rollback migration that restores the original state
3. Document the commands needed to manually fix any issues

## Next Steps

1. Switch to code mode to implement the SQL migration
2. Test the changes
3. Update the database-schema.md documentation if needed