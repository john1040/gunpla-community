import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import dotenv from 'dotenv';
import type { LegacyKit, TranslatedKit } from '../src/types/kit';

dotenv.config();

const API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

if (!API_KEY) {
  throw new Error('GOOGLE_TRANSLATE_API_KEY environment variable must be set');
}

interface TranslatedString {
  ja: string;
  en: string;
  'zh-Hant': string;
}

interface GoogleTranslateResponse {
  data: {
    translations: Array<{
      translatedText: string
    }>
  }
}

async function translateText(text: string, targetLanguage: string): Promise<string> {
  if (!text) return '';
  
  try {
    const response = await axios.post<any>(
      `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`,
      {
        q: text,
        source: 'ja',
        target: targetLanguage,
        format: 'text'
      }
    );

    if (response.data?.data?.translations?.[0]?.translatedText) {
      return response.data.data.translations[0].translatedText;
    }
    
    console.error('Unexpected API response structure:', JSON.stringify(response.data));
    return text;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Translation API error:', {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        text: text.slice(0, 50) + '...'
      });
    } else {
      console.error('Translation error:', error);
    }
    return text;
  }
}

async function translateKitToMultilingual(kit: LegacyKit): Promise<TranslatedKit> {
  try {
    // Clean description by removing HTML tags for better translation
    const cleanDescription = kit.description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Create translated strings for title and description
    const [titleEn, titleZh] = await Promise.all([
      translateText(kit.title, 'en'),
      translateText(kit.title, 'zh-TW')
    ]);

    const [descriptionEn, descriptionZh] = await Promise.all([
      translateText(cleanDescription, 'en'),
      translateText(cleanDescription, 'zh-TW')
    ]);

    // Translate brand
    const [brandEn, brandZh] = await Promise.all([
      translateText(kit.categories.brand, 'en'),
      translateText(kit.categories.brand, 'zh-TW')
    ]);

    // Translate series if it exists
    let seriesTranslations: TranslatedString | undefined;
    if (kit.categories.series) {
      const [seriesEn, seriesZh] = await Promise.all([
        translateText(kit.categories.series, 'en'),
        translateText(kit.categories.series, 'zh-TW')
      ]);
      seriesTranslations = {
        ja: kit.categories.series,
        en: seriesEn,
        'zh-Hant': seriesZh
      };
    }

    return {
      title: {
        ja: kit.title,
        en: titleEn,
        'zh-Hant': titleZh
      },
      releaseDate: kit.releaseDate,
      isoReleaseDate: kit.isoReleaseDate,
      url: kit.url,
      exclusive: kit.exclusive,
      price: kit.price,
      description: {
        ja: kit.description,
        en: descriptionEn,
        'zh-Hant': descriptionZh
      },
      categories: {
        brand: {
          ja: kit.categories.brand,
          en: brandEn,
          'zh-Hant': brandZh
        },
        ...(seriesTranslations && { series: seriesTranslations })
      },
      imgUrlList: kit.imgUrlList
    };
  } catch (error) {
    console.error('Error translating kit:', kit.title);
    console.error(error);
    throw error;
  }
}

async function processFile(filename: string) {
  const inputPath = path.join(process.cwd(), 'public', 'data', filename);
  const outputPath = path.join(process.cwd(), 'public', 'data', 'translated-google', filename);
  
  try {
    // Create output directory if it doesn't exist
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    // Read and parse input file
    const content = await fs.readFile(inputPath, 'utf-8');
    const kits = JSON.parse(content) as LegacyKit[];

    // Process kits in chunks to avoid rate limits
    const chunkSize = 5;
    const translatedKits: TranslatedKit[] = [];
    
    for (let i = 0; i < kits.length; i += chunkSize) {
      const chunk = kits.slice(i, i + chunkSize);
      console.log(`Processing items ${i + 1} to ${Math.min(i + chunkSize, kits.length)} of ${kits.length} from ${filename}`);
      
      for (const kit of chunk) {
        try {
          const translatedKit = await translateKitToMultilingual(kit);
          translatedKits.push(translatedKit);
          // Add a small delay between items to respect API rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to translate kit: ${kit.title}`);
          // Continue with next kit instead of failing entire chunk
        }
      }
      
      // Add longer delay between chunks
      if (i + chunkSize < kits.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Save progress after each chunk
      if (translatedKits.length > 0) {
        await fs.writeFile(
          outputPath, 
          JSON.stringify(translatedKits, null, 2), 
          'utf-8'
        );
        console.log(`Progress saved: ${translatedKits.length}/${kits.length} kits in ${filename}`);
      }
    }

    if (translatedKits.length > 0) {
      console.log(`Successfully translated ${translatedKits.length}/${kits.length} kits in ${filename}`);
    } else {
      console.error(`No kits were successfully translated in ${filename}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filename}:`, error);
  }
}

async function main() {
  const files = [
    'bb-sd.json',
    // 'eg.json',
    // 'fm.json',
    // 'hg.json',
    // 'mg.json',
    // 'mgex.json',
    // 'mgka.json',
    // 'mgsd.json',
    // 'option-parts.json',
    // 'pg.json',
    // 'rg.json'
  ];

  for (const file of files) {
    console.log(`\nProcessing ${file}...`);
    await processFile(file);
  }
}

main().catch(console.error);