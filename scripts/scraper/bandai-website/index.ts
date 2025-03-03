import { BandaiScraper } from './scraper';
import path from 'path';

async function main() {
  // URLs
  const RG = 'https://bandai-hobby.net/brand/rg/';
  const HG = 'https://bandai-hobby.net/brand/hg/';
  const MG = 'https://bandai-hobby.net/brand/mg/';
  const PG = 'https://bandai-hobby.net/brand/pg/';
  const MGKA = 'https://bandai-hobby.net/brand/mgka/';
  const FM = 'https://bandai-hobby.net/brand/fullmechanics/';
  const OPTION_PARTS = 'https://bandai-hobby.net/brand/optionpartsset/';
  const BB = 'https://bandai-hobby.net/brand/bb/';
  const MGSD = 'https://bandai-hobby.net/brand/mgsd/';
  const MGEX = 'https://bandai-hobby.net/brand/mgex/';
  const EG = 'https://bandai-hobby.net/brand/entry_grade_g/';
  const EXPO = 'https://bandai-hobby.net/brand/expo2025-gunpla/';
  // Output paths
  const publicDataDir = path.join(__dirname, '../../../public/data');
  const rgOutputPath = path.join(publicDataDir, 'rg.json');
  const hgOutputPath = path.join(publicDataDir, 'hg.json');

  try {
    // // Scrape RG kits
    // console.log('Scraping RG kits...');
    // const rgScraper = new BandaiScraper(RG, rgOutputPath);
    // await rgScraper.scrapeItems();
    // console.log('RG scraping completed!');

    // // Scrape HG kits
    // console.log('Scraping HG kits...');
    // const hgScraper = new BandaiScraper(HG, hgOutputPath);
    // await hgScraper.scrapeItems();
    // console.log('HG scraping completed!');

    // Scrape MG kits
    console.log('Scraping MG kits...');
    const mgScraper = new BandaiScraper(MG, path.join(publicDataDir, 'mg.json'));
    await mgScraper.scrapeItems();
    console.log('MG scraping completed!');  

    // Scrape PG kits
    console.log('Scraping PG kits...');
    const pgScraper = new BandaiScraper(PG, path.join(publicDataDir, 'pg.json'));
    await pgScraper.scrapeItems();
    console.log('PG scraping completed!');

    // Scrape MGKA kits
    console.log('Scraping MGKA kits...');
    const mgkaScraper = new BandaiScraper(MGKA, path.join(publicDataDir, 'mgka.json'));
    await mgkaScraper.scrapeItems();
    console.log('MGKA scraping completed!');

    // Scrape FM kits
    console.log('Scraping FM kits...');
    const fmScraper = new BandaiScraper(FM, path.join(publicDataDir, 'fm.json'));
    await fmScraper.scrapeItems();
    console.log('FM scraping completed!');

    // Scrape Option Parts kits
    console.log('Scraping Option Parts kits...');
    const optionPartsScraper = new BandaiScraper(OPTION_PARTS, path.join(publicDataDir, 'option-parts.json'));
    await optionPartsScraper.scrapeItems();
    console.log('Option Parts scraping completed!');

    // Scrape BB kits
    console.log('Scraping BB kits...');
    const bbScraper = new BandaiScraper(BB, path.join(publicDataDir, 'bb.json'));
    await bbScraper.scrapeItems();
    console.log('BB scraping completed!');

    // Scrape MGSD kits
    console.log('Scraping MGSD kits...');
    const mgsdScraper = new BandaiScraper(MGSD, path.join(publicDataDir, 'mgsd.json'));
    await mgsdScraper.scrapeItems();
    console.log('MGSD scraping completed!');

    // Scrape MGEX kits
    console.log('Scraping MGEX kits...');
    const mgexScraper = new BandaiScraper(MGEX, path.join(publicDataDir, 'mgex.json'));
    await mgexScraper.scrapeItems();
    console.log('MGEX scraping completed!');

    // Scrape EG kits
    console.log('Scraping EG kits...');
    const egScraper = new BandaiScraper(EG, path.join(publicDataDir, 'eg.json'));
    await egScraper.scrapeItems();
    console.log('EG scraping completed!');

    // Scrape EXPO kits
    console.log('Scraping EXPO kits...');
    const expoScraper = new BandaiScraper(EXPO, path.join(publicDataDir, 'expo.json'));
    await expoScraper.scrapeItems();
    console.log('EXPO scraping completed!');

    console.log('All scraping completed successfully!');
    console.log('Now run: npx tsx scripts/sync-kits.ts');
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main().catch(console.error);
