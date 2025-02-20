# Supabase Database Setup Instructions

## Option 1: Using Supabase CLI (Recommended)

1. Install Supabase CLI if not already installed:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```
(Find your project ref in the Supabase dashboard URL: https://app.supabase.com/project/your-project-ref)

4. Push the migrations:
```bash
supabase db push
```

## Option 2: Manual SQL Execution

If you prefer to run the migrations manually through the Supabase Dashboard:

1. Go to your project in the [Supabase Dashboard](https://app.supabase.com)
2. Navigate to SQL Editor
3. Copy the contents of `supabase/migrations/20250217_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the SQL

## Verification Steps

After applying the migrations, verify the setup:

1. Check Tables
- Go to Database → Tables in the Supabase Dashboard
- Verify all tables are created:
  - kits
  - kit_images
  - user_profiles
  - ratings
  - comments
  - comment_likes
  - wanted_list

2. Check RLS Policies
- Click each table and go to the "Authentication" tab
- Verify RLS is enabled and policies are in place

3. Check Functions
- Go to Database → Functions
- Verify the `handle_new_user` function exists

4. Test User Creation Flow
- Create a new user through authentication
- Verify a user_profile record is automatically created

## Troubleshooting

If you encounter any issues:

1. Check the SQL Editor's error messages
2. Verify all foreign key relationships are correct
3. Ensure RLS policies are not too restrictive
4. Test basic CRUD operations through the Table Editor

## Next Steps

1. Update your Supabase client configuration if needed
2. Implement API functions using the generated types
3. Test all database operations through your application

For any schema changes in the future, create new migration files in the `supabase/migrations` directory with the format `YYYYMMDD_description.sql`.