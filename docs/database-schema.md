# Gunpla Community Database Schema

## Tables

### kits
Primary table for Gunpla kit information.
```sql
CREATE TABLE kits (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_jp TEXT,
    grade TEXT NOT NULL,
    scale TEXT NOT NULL,
    series TEXT,
    brand TEXT,
    is_p_bandai BOOLEAN DEFAULT false,
    product_url TEXT,
    product_image TEXT,
    release_date DATE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
```

### kit_images
Stores multiple images for each kit.
```sql
CREATE TABLE kit_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT kit_images_kit_id_image_url_unique UNIQUE (kit_id, image_url)
);
```

### user_profiles
Stores user profile information.
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,  -- matches auth.users.id
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
```

### ratings
Stores user ratings for kits.
```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, kit_id)
);
```

### comments
Stores user comments on kits with support for nested replies.
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);
```

### comment_likes
Tracks likes on comments.
```sql
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, comment_id)
);
```

### wanted_list
Tracks users' wishlist of kits.
```sql
CREATE TABLE wanted_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, kit_id)
);
```

## Row Level Security (RLS) Policies

### kits
- 🔓 SELECT: Public read access
- 🔒 INSERT: Authenticated users only
- 🔒 UPDATE: Authenticated users only

### kit_images
- 🔓 SELECT: Public read access
- 🔒 INSERT: Authenticated users only
- 🔒 UPDATE: Authenticated users only

### user_profiles
- 🔓 SELECT: Public read access
- 🔒 INSERT: Only for own profile (auth.uid() = id)
- 🔒 UPDATE: Only for own profile (auth.uid() = id)

### ratings
- 🔓 SELECT: Public read access
- 🔒 INSERT: Only for own ratings (auth.uid() = user_id)
- 🔒 UPDATE: Only for own ratings (auth.uid() = user_id)
- 🔒 DELETE: Only for own ratings (auth.uid() = user_id)

### comments
- 🔓 SELECT: Public read access
- 🔒 INSERT: Only for own comments (auth.uid() = user_id)
- 🔒 UPDATE: Only for own comments (auth.uid() = user_id)
- 🔒 DELETE: Only for own comments (auth.uid() = user_id)

### comment_likes
- 🔓 SELECT: Public read access
- 🔒 INSERT: Only for own likes (auth.uid() = user_id)
- 🔒 DELETE: Only for own likes (auth.uid() = user_id)

### wanted_list
- 🔓 SELECT: Public read access
- 🔒 INSERT: Only for own wishlist (auth.uid() = user_id)
- 🔒 DELETE: Only for own wishlist (auth.uid() = user_id)

## Storage

### Buckets
- `profiles`: Public bucket for user profile assets
  - Structure: `/avatars/{user_id}/avatar.*`
  - File size limit: 5MB
  - Allowed MIME types: image/jpeg, image/png, image/webp

### Storage Configuration
- `profiles` bucket:
  - Public access: true
  - File size limit: 5MB
  - Allowed MIME types: image/jpeg, image/png, image/webp
  - Structure: `/avatars/{user_id}.*`

### Storage Policies
Profiles bucket has the following policies:

#### Avatar Files
- 🔓 SELECT: Public read access for all files in profiles bucket
- 🔒 INSERT: Authenticated users can upload their own avatar
  - Must be in profiles bucket
  - Must be in avatars folder
  - File path must contain user's ID
- 🔒 UPDATE: Users can only update their own avatar files
  - Same restrictions as INSERT
- 🔒 DELETE: Users can only delete their own avatar files
  - Same restrictions as INSERT

## Functions and Triggers

### Profile Management
```sql
-- Automatically create user_profile on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (
        id,
        display_name,
        avatar_url
    ) VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Force profile creation for existing users
CREATE OR REPLACE FUNCTION public.force_create_profile(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER AS $$
-- See migration file for implementation details
$$;
```

## Database Permissions

### Role-based Access
- `anon`: 
  - SELECT on user_profiles
- `authenticated`:
  - SELECT on all tables
  - INSERT/UPDATE/DELETE based on RLS policies
  - USAGE on public schema
- `postgres`, `service_role`:
  - ALL on all tables
  - ALL on storage buckets and objects