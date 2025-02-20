-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create kits table
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

-- Create kit_images table
CREATE TABLE kit_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
CREATE INDEX idx_kit_images_kit_id ON kit_images(kit_id);

-- Create user_profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY,  -- matches Supabase auth.users.id
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create ratings table
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

-- Create comments table
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

-- Create comment_likes table
CREATE TABLE comment_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, comment_id)
);
CREATE INDEX idx_comment_likes_comment_id ON comment_likes(comment_id);
CREATE INDEX idx_comment_likes_user_id ON comment_likes(user_id);

-- Create wanted_list table
CREATE TABLE wanted_list (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    kit_id UUID NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, kit_id)
);
CREATE INDEX idx_wanted_list_user_id ON wanted_list(user_id);
CREATE INDEX idx_wanted_list_kit_id ON wanted_list(kit_id);

-- Enable Row Level Security
ALTER TABLE kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kit_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE wanted_list ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- kits policies
CREATE POLICY "Enable read access for all users" ON kits
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON kits
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON kits
    FOR UPDATE TO authenticated USING (true);

-- kit_images policies
CREATE POLICY "Enable read access for all users" ON kit_images
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON kit_images
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON kit_images
    FOR UPDATE TO authenticated USING (true);

-- user_profiles policies
CREATE POLICY "Enable read access for all users" ON user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON user_profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ratings policies
CREATE POLICY "Enable read access for all users" ON ratings
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON ratings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON ratings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON ratings
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- comments policies
CREATE POLICY "Enable read access for all users" ON comments
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON comments
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users based on user_id" ON comments
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON comments
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- comment_likes policies
CREATE POLICY "Enable read access for all users" ON comment_likes
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON comment_likes
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON comment_likes
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- wanted_list policies
CREATE POLICY "Enable read access for all users" ON wanted_list
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON wanted_list
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for users based on user_id" ON wanted_list
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Create trigger for creating user profile on auth.user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id)
    VALUES (new.id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();