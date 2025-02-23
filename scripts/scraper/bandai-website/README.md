# Bandai Website Scraper

A TypeScript-based web scraper designed to extract product information from the Bandai Hobby website.

## Features

- Scrapes product details including:
  - Title
  - Release Date
  - Product URL
  - Exclusive Status (P-Bandai items)
  - Price
  - Product Images (handles both regular and exclusive items)
    - For regular items: Fetches all product images from individual product pages
    - For exclusive items (P-Bandai): Extracts image directly from the listing page
- Handles pagination
- Saves data in JSON format
- Built-in error handling and logging
- Respects website's structure with proper user agent

## Prerequisites

```bash
npm install axios cheerio
```

## Usage

```typescript
import { BandaiScraper } from './scraper';

const scraper = new BandaiScraper(
  'https://bandai-hobby.net/site/schedule.html',
  'output.json'
);

await scraper.scrapeItems();
```

## Output Format

The scraper outputs data in the following JSON structure:

```json
[
  {
    "title": "Product Title",
    "releaseDate": "Release Date",
    "url": "Product URL",
    "exclusive": "Exclusive Status",
    "price": "Price",
    "imgUrlList": [
      "Image URL 1",
      "Image URL 2",
      ...
    ]
  },
  ...
]
```

## Implementation Details

### Main Components

1. **BandaiScraper Class**
   - Manages the scraping process
   - Handles HTTP requests and parsing
   - Saves data to JSON file

2. **Scraping Process**
   - Fetches main product listing page
   - Extracts basic product information
   - Visits individual product pages for detailed information
   - Collects and processes image URLs
   - Aggregates all data into a structured format

### Key Methods

- `scrapeItems()`: Main method to initiate scraping
- `fetchPage()`: Handles HTTP requests with proper headers
- `saveToJson()`: Saves scraped data to JSON file

## Error Handling

The scraper includes comprehensive error handling for:
- Failed HTTP requests
- Invalid HTML structure
- File system operations
- Network timeouts

## Limitations

- Currently set to scrape only the first page (configurable via the `page < 2` condition)
- Depends on Bandai website's current HTML structure
- Rate limited by network requests

## Future Improvements

Potential enhancements could include:
- Configurable pagination limits
- Rate limiting/throttling
- Proxy support
- More detailed error reporting
- Data validation
- Database integration

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open-sourced under the MIT license.