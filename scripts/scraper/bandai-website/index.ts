import { BandaiScraper } from './scraper';
import path from 'path';

async function main() {
  // Configure your scraper
  const RG = 'https://bandai-hobby.net/brand/rg/';
  const HG = 'https://bandai-hobby.net/brand/hg/';
  const baseUrl = RG;
  const outputPath = path.join(__dirname, 'output.json');

  const scraper = new BandaiScraper(baseUrl, outputPath);

  try {
    await scraper.scrapeItems();
    console.log('Scraping completed successfully!');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main().catch(console.error);
