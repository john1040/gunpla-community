import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function syncKits() {
  try {
    // Read JSON files
    const rgData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/rg.json'), 'utf8'));
    const hgData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/hg.json'), 'utf8'));
    const mgData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/mg.json'), 'utf8'));
    const pgData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/pg.json'), 'utf8'));
    const mgkaData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/mgka.json'), 'utf8'));
    const fmData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/fm.json'), 'utf8'));
    const optionPartsData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/option-parts.json'), 'utf8'));
    const bbData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/bb.json'), 'utf8'));
    const mgsdData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/mgsd.json'), 'utf8'));
    const mgexData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'public/data/mgex.json'), 'utf8'));

    // Process and combine all kits
    const allKits = [
      ...rgData.map((kit: any) => ({
        ...kit,
        grade: 'RG'
      })),
      ...hgData.map((kit: any) => ({
        ...kit,
        grade: 'HG'
      })),
      ...mgData.map((kit: any) => ({
        ...kit,
        grade: 'MG'
      })),
      ...pgData.map((kit: any) => ({
        ...kit,
        grade: 'PG'
      })),
      ...mgkaData.map((kit: any) => ({
        ...kit,
        grade: 'MGKA'
      })),
      ...fmData.map((kit: any) => ({
        ...kit,
        grade: 'FM'
      })),
      ...optionPartsData.map((kit: any) => ({
        ...kit,
        grade: 'Option Parts'
      })),
      ...bbData.map((kit: any) => ({
        ...kit,
        grade: 'BB'
      })),
      ...mgsdData.map((kit: any) => ({
        ...kit,
        grade: 'MGSD'
      })),
      ...mgexData.map((kit: any) => ({
        ...kit,
        grade: 'MGEX'
      }))
    ];

    // Transform data for database insertion
    const kitsToInsert = allKits.map(kit => {
      const kitId = kit.url.split("/").filter(Boolean).pop()?.replace(/\/$/, '') || "";
      
      return {
        id: kitId,
        name_en: kit.title,
        name_jp: null, // Can be added later if available
        grade: kit.grade,
        scale: kit.grade === 'RG' ? '1/144' : kit.scale || '1/144',
        release_date: kit.isoReleaseDate ? new Date(kit.isoReleaseDate) : null,
        price: kit.price,
        series: kit.categories?.series || null,
        brand: kit.categories?.brand || null,
        is_p_bandai: kit.exclusive?.toLowerCase().includes('p-bandai') || false,
        product_url: kit.url.startsWith('http') ? kit.url : `https://bandai.com${kit.url}`,
        description: kit.description || null
      };
    });

    // Insert kits in batches to avoid request size limits
    const BATCH_SIZE = 50;
    for (let i = 0; i < kitsToInsert.length; i += BATCH_SIZE) {
      const batch = kitsToInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('kits')
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error(`Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
        continue;
      }
      console.log(`Processed batch ${i / BATCH_SIZE + 1} of ${Math.ceil(kitsToInsert.length / BATCH_SIZE)}`);
    }

    // Insert images
    const images = allKits.flatMap(kit => {
      const kitId = kit.url.split("/").filter(Boolean).pop()?.replace(/\/$/, '') || "";
      return (kit.imgUrlList || []).map((url: string) => ({
        kit_id: kitId,
        image_url: url
      }));
    });

    // Insert images in batches
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('kit_images')
        .upsert(batch, {
          onConflict: 'kit_id,image_url',
          ignoreDuplicates: true
        });
      
      if (error) {
        console.error(`Error inserting image batch ${i / BATCH_SIZE + 1}:`, error);
        continue;
      }
      console.log(`Processed image batch ${i / BATCH_SIZE + 1} of ${Math.ceil(images.length / BATCH_SIZE)}`);
    }

    console.log('Kit sync completed successfully!');
  } catch (error) {
    console.error('Error syncing kits:', error);
    process.exit(1);
  }
}

syncKits();
