import * as cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

interface ScrapedItem {
  title: string;
  releaseDate: string;
  url: string;
  exclusive: string;
  price: string;
  description?: string;
  categories: {
    brand?: string;
    series?: string;
  };
  imgUrlList: string[];
}

export class BandaiScraper {
  private baseUrl: string;
  private outputPath: string;

  constructor(baseUrl: string, outputPath: string) {
    this.baseUrl = baseUrl;
    this.outputPath = outputPath;
  }

  private async fetchPage(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  private async saveToJson(data: ScrapedItem[]): Promise<void> {
    try {
      const jsonData = JSON.stringify(data, null, 2);
      await fs.writeFile(this.outputPath, jsonData, 'utf-8');
      console.log(`Data saved to ${this.outputPath}`);
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  public async scrapeItems(): Promise<void> {
    const scrapedItems: ScrapedItem[] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const url = `${this.baseUrl}?p=${page}`;
      // console.log(url)
      try {
        const html = await this.fetchPage(url);
        const $ = cheerio.load(html);

        const itemPromises = $('.bhs_pdlist_sbs li').map(async (_, element) => {
          const title = $(element).find('.bhs_pd_ttl').text().trim();
          const releaseDate = $(element).find('.bhs_pd_deliver').text().trim();
          const itemUrl = $(element).find('a').attr('href');
          const isExclusive = $(element).find('.bhs_pd_cat').text().trim();
          const price = $(element).find('.bhs_pd_price').text().trim();
          const imgUrlList: string[] = [];
          let description = '';
          let categories: ScrapedItem['categories'] = {
            brand: undefined,
            series: undefined
          };

          // Handle exclusive items (P-Bandai)
          if (itemUrl?.startsWith('https://p-bandai.jp/')) {
            const imgUrl = $(element).find('img').attr('src');
            if (imgUrl) {
              imgUrlList.push(`https://bandai-hobby.net${imgUrl}`);
            }
          }
          // Handle regular items
          else if (title && releaseDate && itemUrl?.startsWith('/item')) {
            const individualUrl = `https://bandai-hobby.net${itemUrl}`;
            // console.log(individualUrl);
            const html2 = await this.fetchPage(individualUrl);
            const $2 = cheerio.load(html2);
            
            const imgElements = $2('#bhs_gallery_thumbs li');
            // console.log('Elements found:', imgElements.length);
            
            imgElements.each((_, element) => {
              const imgUrl = $2(element).find('img').attr('src');
              // console.log('Found imgUrl:', imgUrl);
              if (imgUrl) {
                imgUrlList.push(`https://bandai-hobby.net${imgUrl}`);
              }
            });

            // Extract description
            description = $2('.bhs_detail_explain p').html() || '';

            // Extract categories from bhs_sale_works
            const brandText = $2('.bhs_sale_works_title span').text().trim();
            const seriesText = $2('.bhs_sale_works_series span').text().trim();
            console.log('Found brand text:', brandText);
            console.log('Found series text:', seriesText);
            
            categories.brand = brandText || undefined;
            categories.series = seriesText || undefined;
          }

          return {
            title,
            releaseDate,
            url: itemUrl ?? '',
            exclusive: isExclusive,
            price: price,
            description,
            categories,
            imgUrlList
          };
        }).get();

        const pageItems = await Promise.all(itemPromises);
        scrapedItems.push(...pageItems);
        console.log('Page items:', pageItems);

        hasNextPage = $('.next').length > 0;
        page++;
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        hasNextPage = false;
      }
    }

    console.log('Final items to save:', scrapedItems);
    await this.saveToJson(scrapedItems);
  }
}
