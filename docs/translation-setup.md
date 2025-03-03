# Setting up Translations for Kit Data

This guide explains how to set up the Google Cloud Translation API for translating Gunpla kit data.

## Prerequisites

1. A Google Cloud account
2. The Google Cloud SDK installed on your machine

## Setup Steps

1. Create a new Google Cloud project or use an existing one
   ```bash
   gcloud projects create [PROJECT_ID] --name="Gunpla Community"
   ```

2. Enable the Cloud Translation API
   ```bash
   gcloud services enable translate.googleapis.com
   ```

3. Create a service account and download credentials
   ```bash
   # Create service account
   gcloud iam service-accounts create gunpla-translator \
     --description="Service account for translating Gunpla kit data" \
     --display-name="Gunpla Translator"

   # Create and download key
   gcloud iam service-accounts keys create google-credentials.json \
     --iam-account=gunpla-translator@[PROJECT_ID].iam.gserviceaccount.com
   ```

4. Add the following variables to your `.env` file:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/google-credentials.json"
   GOOGLE_CLOUD_PROJECT_ID="your-project-id"
   ```

## Running the Translation Script

1. Make sure all dependencies are installed:
   ```bash
   npm install
   ```

2. Run the translation script:
   ```bash
   npx ts-node scripts/translate-kits.ts
   ```

The script will:
- Process each JSON file in the `public/data` directory
- Translate content to English and Traditional Chinese
- Save translated files in `public/data/translated/[language]`
- Process items in small chunks with delays to avoid rate limits

## Notes

- The script preserves the original structure of the data while translating key fields
- HTML tags in descriptions are stripped for better translation results
- Numeric values (like prices) are preserved while only translating the text
- File processing includes error handling and progress logging
- The translated files will maintain the same filename as the original

## Troubleshooting

If you encounter errors:
1. Verify your Google Cloud credentials are correct
2. Ensure the Translation API is enabled
3. Check your project has billing enabled
4. Verify you have sufficient quota/credits for translations