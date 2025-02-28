import { BandaiScraper } from './scraper';
import path from 'path';

async function main() {
  // URLs
  const RG = 'https://bandai-hobby.net/brand/rg/';
  const HG = 'https://bandai-hobby.net/brand/hg/';
  
  // Output paths
  const publicDataDir = path.join(__dirname, '../../../public/data');
  const rgOutputPath = path.join(publicDataDir, 'rg.json');
  const hgOutputPath = path.join(publicDataDir, 'hg.json');

  try {
    // Scrape RG kits
    console.log('Scraping RG kits...');
    const rgScraper = new BandaiScraper(RG, rgOutputPath);
    await rgScraper.scrapeItems();
    console.log('RG scraping completed!');

    // Scrape HG kits
    console.log('Scraping HG kits...');
    const hgScraper = new BandaiScraper(HG, hgOutputPath);
    await hgScraper.scrapeItems();
    console.log('HG scraping completed!');

    console.log('All scraping completed successfully!');
    console.log('Now run: npx tsx scripts/sync-kits.ts');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main().catch(console.error);
