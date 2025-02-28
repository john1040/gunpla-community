-- Drop all foreign key constraints first
DO $$ BEGIN
    ALTER TABLE kit_images DROP CONSTRAINT IF EXISTS kit_images_kit_id_fkey;
    ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_kit_id_fkey;
    ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_kit_id_fkey;
    ALTER TABLE wanted_list DROP CONSTRAINT IF EXISTS wanted_list_kit_id_fkey;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Change ID type from UUID to TEXT
DO $$ BEGIN
    ALTER TABLE kits DROP CONSTRAINT IF EXISTS kits_pkey;
    ALTER TABLE kits ALTER COLUMN id TYPE TEXT;
    ALTER TABLE kits ADD PRIMARY KEY (id);

    ALTER TABLE kit_images ALTER COLUMN kit_id TYPE TEXT;
    ALTER TABLE ratings ALTER COLUMN kit_id TYPE TEXT;
    ALTER TABLE comments ALTER COLUMN kit_id TYPE TEXT;
    ALTER TABLE wanted_list ALTER COLUMN kit_id TYPE TEXT;
EXCEPTION
    WHEN others THEN null;
END $$;

-- Add back foreign key constraints and unique constraint for kit_images
ALTER TABLE kit_images
ADD CONSTRAINT kit_images_kit_id_fkey 
FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;

-- Add unique constraint for kit_images if it doesn't exist
DO $$ BEGIN
    ALTER TABLE kit_images
    ADD CONSTRAINT kit_images_kit_id_image_url_unique 
    UNIQUE (kit_id, image_url);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;

-- Add back other foreign key constraints
ALTER TABLE ratings
ADD CONSTRAINT ratings_kit_id_fkey 
FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;

ALTER TABLE comments
ADD CONSTRAINT comments_kit_id_fkey 
FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;

ALTER TABLE wanted_list
ADD CONSTRAINT wanted_list_kit_id_fkey 
FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;

-- Add new columns if they don't exist
DO $$ BEGIN
    ALTER TABLE kits ADD COLUMN IF NOT EXISTS series TEXT;
    ALTER TABLE kits ADD COLUMN IF NOT EXISTS brand TEXT;
    ALTER TABLE kits ADD COLUMN IF NOT EXISTS is_p_bandai BOOLEAN DEFAULT false;
    ALTER TABLE kits ADD COLUMN IF NOT EXISTS product_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;
