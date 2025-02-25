-- Add product_image column to kits table
ALTER TABLE kits ADD COLUMN product_image text;

-- Fill existing kits with product image from kit_images
UPDATE kits
SET product_image = (
  SELECT image_url
  FROM kit_images
  WHERE kit_images.kit_id = kits.id
  ORDER BY created_at ASC
  LIMIT 1
);