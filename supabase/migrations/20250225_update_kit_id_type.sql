-- First drop all foreign key constraints
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_kit_id_fkey;
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_kit_id_fkey;
ALTER TABLE kit_images DROP CONSTRAINT IF EXISTS kit_images_kit_id_fkey;
ALTER TABLE wanted_list DROP CONSTRAINT IF EXISTS wanted_list_kit_id_fkey;

-- Change kit_id column type in kits table
ALTER TABLE kits 
  ALTER COLUMN id TYPE text;

-- Change kit_id column type in dependent tables
ALTER TABLE comments 
  ALTER COLUMN kit_id TYPE text;
ALTER TABLE ratings 
  ALTER COLUMN kit_id TYPE text;
ALTER TABLE kit_images 
  ALTER COLUMN kit_id TYPE text;
ALTER TABLE wanted_list 
  ALTER COLUMN kit_id TYPE text;

-- Recreate foreign key constraints
ALTER TABLE comments 
  ADD CONSTRAINT comments_kit_id_fkey 
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;
ALTER TABLE ratings 
  ADD CONSTRAINT ratings_kit_id_fkey 
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;
ALTER TABLE kit_images 
  ADD CONSTRAINT kit_images_kit_id_fkey 
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;
ALTER TABLE wanted_list 
  ADD CONSTRAINT wanted_list_kit_id_fkey 
  FOREIGN KEY (kit_id) REFERENCES kits(id) ON DELETE CASCADE;