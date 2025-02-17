import axios from 'axios'
import * as cheerio from 'cheerio'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { Database } from '../../src/lib/supabase/types'

// Load environment variables
dotenv.config()

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface KitData {
  name_en: string
  name_jp?: string
  grade: string
  scale: string
  image_url?: string
}

async function scrapeRGKits() {
  try {
    console.log('Starting RG kits scraping...')
    const response = await axios.get('https://acg.78dm.net/ct/341672.html')
    const $ = cheerio.load(response.data)

    const kits: KitData[] = []

    // Extract kit information (this is a placeholder - needs to be updated with actual selectors)
    $('.kit-item').each((_index: number, element: cheerio.Element) => {
      const kit: KitData = {
        name_en: $(element).find('.kit-name-en').text().trim(),
        name_jp: $(element).find('.kit-name-jp').text().trim() || undefined,
        grade: 'RG',
        scale: '1/144',
        image_url: $(element).find('img').attr('src'),
      }
      kits.push(kit)
    })

    console.log(`Found ${kits.length} kits`)

    // Insert kits into database
    for (const kit of kits) {
      const { image_url, ...kitData } = kit

      // Insert kit
      const { data: kitResult, error: kitError } = await supabase
        .from('kits')
        .insert(kitData)
        .select()
        .single()

      if (kitError) {
        console.error('Error inserting kit:', kitError)
        continue
      }

      // Insert image if available
      if (image_url && kitResult) {
        const { error: imageError } = await supabase
          .from('kit_images')
          .insert({
            kit_id: kitResult.id,
            image_url,
          })

        if (imageError) {
          console.error('Error inserting image:', imageError)
        }
      }

      console.log(`Inserted kit: ${kitData.name_en}`)
    }

    console.log('Scraping completed successfully')
  } catch (error) {
    console.error('Error during scraping:', error)
  }
}

// Run the scraper
scrapeRGKits()