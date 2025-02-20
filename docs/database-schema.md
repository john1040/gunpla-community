# Gunpla Community Database Schema

## Overview
This document outlines the database schema for the Gunpla Community platform. The schema includes tables for managing Gunpla kits, user profiles, ratings, comments, and more.

## Tables

### kits
Primary table for storing Gunpla model kit information.
```sql
CREATE TABLE kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en TEXT NOT NULL,
    name_jp TEXT,
    grade TEXT NOT NULL,
    scale TEXT NOT NULL,
    release_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### kit_images
Stores images associated with kits.
```sql
CREATE TABLE kit_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX idx_kit_images_kit_id ON kit_images(kit_id);
```

### user_profiles
Stores user profile information.
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,  -- matches Supabase auth.users.id
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### ratings
Stores user ratings for kits.
```sql
CREATE TABLE ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, kit_id)
);
CREATE INDEX idx_ratings_kit_id ON ratings(kit_id);
CREATE INDEX idx_ratings_user_id ON ratings(user_id);
```

### comments
Stores user comments on kits with support for nested comments.
```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX idx_comments_kit_id ON comments(kit_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
```

### comment_likes
Stores likes on comments.
```sql
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, comment_id)
);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);
```

### wanted_list
Stores users' wanted kits.
```sql
CREATE TABLE wanted_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, kit_id)
);
CREATE INDEX idx_wanted_list_user_id ON wanted_list(user_id);
CREATE INDEX idx_wanted_list_kit_id ON wanted_list(kit_id);
```

## Row Level Security (RLS) Policies

### kits
- Everyone can view all kits
- Only admins can insert/update/delete kits

### kit_images
- Everyone can view all kit images
- Only admins can insert/update/delete kit images

### user_profiles
- Everyone can view all user profiles
- Users can only update their own profile
- No manual inserts/deletes (managed by auth triggers)

### ratings
- Everyone can view all ratings
- Users can only create/update/delete their own ratings

### comments
- Everyone can view all comments
- Users can only create/update/delete their own comments

### comment_likes
- Everyone can view all comment likes
- Users can only create/delete their own likes

### wanted_list
- Everyone can view all wanted list entries
- Users can only create/delete their own wanted list entries

## Implementation Steps

1. Create migration file with above schema
2. Apply migration to Supabase project
3. Set up Row Level Security policies
4. Create any necessary database functions or triggers
5. Verify schema matches our TypeScript types
6. Test all database operations through the API

## Next Steps
Switch to Code mode to implement this schema in Supabase.