# Excluding Language Variants in Scrape/Crawl Configurations

When crawling multilingual websites, you may want to exclude certain language variants to focus on a specific language, such as English. This can be achieved by specifying `excludePaths` in your crawl configuration.

## Common Language Paths

To exclude most common language variants across sites:

```json
"excludePaths": [
  "^/ar/",     // Arabic
  "^/cs/",     // Czech
  "^/de/",     // German
  "^/es/",     // Spanish
  "^/fr/",     // French
  "^/he/",     // Hebrew
  "^/hi/",     // Hindi
  "^/id/",     // Indonesian
  "^/it/",     // Italian
  "^/ja/",     // Japanese
  "^/ko/",     // Korean
  "^/nl/",     // Dutch
  "^/pl/",     // Polish
  "^/pt/",     // Portuguese
  "^/pt-BR/",  // Brazilian Portuguese
  "^/ru/",     // Russian
  "^/sv/",     // Swedish
  "^/th/",     // Thai
  "^/tr/",     // Turkish
  "^/uk/",     // Ukrainian
  "^/vi/",     // Vietnamese
  "^/zh/",     // Chinese
  "^/zh-CN/",  // Simplified Chinese
  "^/zh-TW/"   // Traditional Chinese
]
```

## Example Crawl Configuration

### Crawl docs.claude.com (English only)

```bash
curl -X POST 'https://firecrawl.tootie.tv/v2/crawl' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer test-key' \
  -d '{
    "url": "https://docs.claude.com",
    "excludePaths": ["^/ar/", "^/cs/", "^/de/", "^/es/", "^/fr/", "^/he/", "^/hi/", "^/id/", "^/it/", "^/ja/", "^/ko/", "^/nl/", "^/pl/", "^/pt/", "^/pt-BR/", "^/ru/", "^/sv/", "^/th/", "^/tr/", "^/uk/", "^/vi/", "^/zh/", "^/zh-CN/", "^/zh-TW/"],
    "scrapeOptions": {
      "formats": ["markdown", "html"]
    }
  }'
```

## Notes

- All language paths use regex patterns
- The `^` anchor ensures matching from the start of the path
- The trailing `/` ensures we match the directory
