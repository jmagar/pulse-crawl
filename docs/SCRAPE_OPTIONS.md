# Firecrawl Scrape Options

This document outlines all available Firecrawl scrape options and provides recommended defaults for both individual scrapes and crawl operations.

## API Version

We use **Firecrawl v2 API** for both scrape and crawl endpoints:
- Scrape: `POST /v2/scrape`
- Crawl: `POST /v2/crawl`

## Complete Parameter Reference

### Output Formats

**`formats`** (array of strings)
- Available formats: `["markdown", "html", "rawHtml", "screenshot", "links"]`
- Default: `["markdown", "html"]`
- Description: Specifies which output formats to include in the response
- Examples:
  - `["markdown"]` - LLM-optimized markdown only
  - `["markdown", "html"]` - Both cleaned markdown and processed HTML
  - `["markdown", "rawHtml", "screenshot"]` - For visual verification
  - `["links"]` - Extract all links from the page

### Content Filtering

**`onlyMainContent`** (boolean)
- Default: `true` (in v1+)
- Description: Extract only primary content, excluding headers, navigation, footers, and ads
- Use case: Most scraping scenarios where you want the core article/content
- Note: When true, this overrides `excludeTags` with more aggressive filtering

**`includeTags`** (array of strings)
- Default: `undefined`
- Description: Only include specific HTML tags in output
- Examples:
  - `["article", "main"]` - Focus on main content areas
  - `["p", "h1", "h2", "h3"]` - Text and headings only
  - `["div[class='content']"]` - CSS selector style
- Use case: Highly structured sites where you know exactly what tags contain the content

**`excludeTags`** (array of strings)
- Default: `undefined`
- Description: Remove specific HTML tags from output
- Examples:
  - `["nav", "footer", "aside"]` - Common layout elements
  - `["script", "style"]` - Remove scripts and styles
  - `["iframe", "embed"]` - Remove embedded content
- Use case: When `onlyMainContent` isn't aggressive enough
- Note: Ignored when `onlyMainContent` is `true`

**`removeBase64Images`** (boolean)
- Default: `false`
- Description: Strip base64-encoded images from output to reduce payload size
- Use case: When you don't need inline images or want to reduce token usage

**`blockAds`** (boolean)
- Default: `false`
- Description: Block advertisements and tracking scripts
- Use case: News sites, blogs, content sites with heavy ad presence

### Page Interaction

**`waitFor`** (number, milliseconds)
- Default: `0`
- Description: Wait time before scraping (for dynamic content loading)
- Examples:
  - `1000` - 1 second delay
  - `3000` - 3 seconds for slower sites
  - `5000` - 5 seconds for heavy JavaScript sites
- Use case: Single-page applications, lazy-loaded content, dynamic rendering

**`timeout`** (number, milliseconds)
- Default: `30000` (30 seconds)
- Description: Maximum time to wait for page load
- Examples:
  - `10000` - Fast timeout for simple pages
  - `60000` - Extended timeout for slow sites
- Use case: Control request duration and prevent hanging

**`actions`** (array of action objects)
- Default: `undefined`
- Description: Execute actions before scraping (clicks, scrolls, waits)
- Examples:
  ```json
  [
    {"type": "wait", "milliseconds": 2000},
    {"type": "click", "selector": "#load-more"},
    {"type": "wait", "selector": ".content-loaded"}
  ]
  ```
- Use case: Interactive content, "load more" buttons, cookie consent dialogs

### Request Configuration

**`headers`** (object)
- Default: `{}`
- Description: Custom HTTP headers to send with the request
- Examples:
  ```json
  {
    "User-Agent": "CustomBot/1.0",
    "Accept-Language": "en-US",
    "Cookie": "session=abc123"
  }
  ```
- Use case: Authentication, API tokens, custom user agents

**`mobile`** (boolean)
- Default: `false`
- Description: Emulate mobile device for scraping
- Use case: Testing responsive design, mobile-specific content, mobile screenshots

**`skipTlsVerification`** (boolean)
- Default: `false`
- Description: Skip SSL/TLS certificate verification
- Use case: Development environments, self-signed certificates
- Warning: Only use in trusted environments

### Advanced Features

**`parsePDF`** (boolean)
- Default: `true`
- Description: Extract text from PDF files
- Use case: Documentation sites, research papers, downloadable PDFs

**`location`** (object)
- Default: `undefined`
- Description: Simulate requests from specific geographic location
- Example:
  ```json
  {
    "country": "US",
    "languages": ["en-US", "en"]
  }
  ```
- Use case: Geo-restricted content, localized pricing, regional variants

**`proxy`** (string)
- Default: `undefined`
- Options: `"basic"`, `"stealth"`, `"auto"`
- Description: Proxy configuration for anti-bot protection
- `basic` - Standard proxy
- `stealth` - Advanced anti-detection measures
- `auto` - Automatically select best proxy strategy

### Caching & Privacy

**`maxAge`** (number, milliseconds)
- Default: `undefined`
- Description: Return cached content if fresher than maxAge
- Examples:
  - `3600000` - 1 hour cache (60 * 60 * 1000)
  - `86400000` - 24 hour cache (24 * 60 * 60 * 1000)
- Use case: Frequently scraped pages, static content, rate limit management

**`storeInCache`** (boolean)
- Default: `true`
- Description: Store result in Firecrawl's cache
- Use case: Set to false for sensitive or dynamic content

**`zeroDataRetention`** (boolean)
- Default: `false`
- Description: Don't store any data on Firecrawl servers
- Use case: Compliance requirements, sensitive data, privacy concerns

### LLM Extraction (JSON Mode)

**`jsonOptions`** (object)
- Default: `undefined`
- Description: Extract structured data using LLM
- Example:
  ```json
  {
    "schema": {
      "type": "object",
      "properties": {
        "title": {"type": "string"},
        "price": {"type": "number"},
        "description": {"type": "string"}
      }
    },
    "systemPrompt": "Extract product information",
    "prompt": "Focus on pricing and title"
  }
  ```
- Use case: Structured data extraction, product catalogs, directory listings

## Recommended Defaults

### For Individual Scrapes (Fast, Content-Focused)

```json
{
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "blockAds": true,
  "timeout": 30000,
  "storeInCache": true
}
```

**Rationale:**
- `markdown` + `html`: Provides both LLM-ready format and structured HTML
- `onlyMainContent: true`: Strips navigation, ads, footers - maximizes signal-to-noise
- `blockAds: true`: Reduces noise and potential tracking
- `timeout: 30000`: Reasonable default for most sites
- `storeInCache: true`: Enables efficient re-scraping

### For Crawls (Comprehensive, Consistent)

```json
{
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "blockAds": true,
  "timeout": 30000,
  "removeBase64Images": true,
  "storeInCache": true
}
```

**Rationale:**
- Same as individual scrapes, plus:
- `removeBase64Images: true`: Critical for crawls to reduce payload size across many pages

### For Dynamic/JavaScript-Heavy Sites

```json
{
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "waitFor": 3000,
  "timeout": 45000,
  "blockAds": true,
  "storeInCache": true
}
```

**Rationale:**
- `waitFor: 3000`: Allow JavaScript to load content
- `timeout: 45000`: Extended timeout for complex sites

### For Geo-Restricted or Bot-Protected Sites

```json
{
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "proxy": "stealth",
  "mobile": false,
  "blockAds": true,
  "timeout": 45000,
  "storeInCache": false
}
```

**Rationale:**
- `proxy: "stealth"`: Advanced anti-bot measures
- `storeInCache: false`: Fresh data for sites that detect repeated requests

### For Privacy-Sensitive Scraping

```json
{
  "formats": ["markdown"],
  "onlyMainContent": true,
  "zeroDataRetention": true,
  "storeInCache": false,
  "timeout": 30000
}
```

**Rationale:**
- `zeroDataRetention: true`: No server-side storage
- `storeInCache: false`: No caching
- `formats: ["markdown"]`: Minimal data transfer

## Excluding Language Variants in Crawl Configurations

When crawling multilingual websites, you may want to exclude certain language variants to focus on a specific language, such as English. This is achieved by specifying `excludePaths` in your crawl configuration.

### Common Language Paths (Universal)

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

### Domain-Specific Language Excludes

Different documentation sites use different language path patterns. Here are examples for common domains:

#### docs.claude.com
```json
"excludePaths": [
  "^/de/", "^/es/", "^/fr/", "^/id/", "^/it/",
  "^/ja/", "^/ko/", "^/pt/", "^/ru/",
  "^/zh-CN/", "^/zh-TW/"
]
```

#### docs.firecrawl.dev
```json
"excludePaths": [
  "^/es/", "^/fr/", "^/ja/", "^/pt-BR/", "^/zh/"
]
```

#### docs.unraid.net
```json
"excludePaths": [
  "^/de/", "^/es/", "^/fr/", "^/zh/"
]
```

### Example Crawl Configuration

Crawl docs.claude.com (English only):

```bash
curl -X POST 'https://api.firecrawl.dev/v2/crawl' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -d '{
    "url": "https://docs.claude.com",
    "maxDepth": 5,
    "excludePaths": [
      "^/de/", "^/es/", "^/fr/", "^/id/", "^/it/",
      "^/ja/", "^/ko/", "^/pt/", "^/ru/",
      "^/zh-CN/", "^/zh-TW/"
    ],
    "scrapeOptions": {
      "formats": ["markdown", "html"],
      "onlyMainContent": true,
      "blockAds": true,
      "removeBase64Images": true
    }
  }'
```

### Notes on Language Exclusion

- All language paths use **regex patterns**
- The `^` anchor ensures matching from the start of the path
- The trailing `/` ensures we match the directory
- Test your patterns with a small `maxDepth` first to verify behavior

## Implementation Notes

### Current Implementation

As of this documentation:
- **Scrape endpoint**: Using `/v1/scrape` (needs update to `/v2/scrape`)
- **Crawl endpoint**: Using `/v2/crawl` ✓

### Configuration Files

Default scrape options are defined in:
- `shared/src/scraping-client/lib/firecrawl-scrape.ts` - Individual scrapes
- `shared/src/crawl/config.ts` - Crawl configurations

### Environment Variables

```bash
FIRECRAWL_API_KEY=your_api_key_here
FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev  # or your self-hosted instance
```

## Testing Recommendations

When testing new scrape options:

1. **Start minimal**: Test with just `formats: ["markdown"]`
2. **Add one option at a time**: Verify each parameter's effect
3. **Test with `maxDepth: 1`**: For crawls, limit depth during testing
4. **Monitor response size**: Use `removeBase64Images` if payloads are large
5. **Check cache behavior**: Use `maxAge: 0` to force fresh scrapes during testing

## Performance Tips

1. **Reduce formats**: Only request formats you actually need
2. **Use caching**: Set appropriate `maxAge` for frequently accessed pages
3. **Optimize waitFor**: Don't wait longer than necessary
4. **Enable onlyMainContent**: Dramatically reduces token usage for LLMs
5. **Remove images**: Use `removeBase64Images` for text-only use cases
6. **Batch operations**: Use `/v2/batch-scrape` for multiple URLs

## Common Issues & Solutions

### Issue: Too much content
**Solution**: Enable `onlyMainContent`, add `excludeTags`, or use `includeTags`

### Issue: Content not loading (JavaScript)
**Solution**: Add `waitFor: 3000`, increase `timeout`, or use `actions`

### Issue: Getting blocked
**Solution**: Add `proxy: "stealth"`, try `mobile: true`, or add custom `headers`

### Issue: Large payloads
**Solution**: Enable `removeBase64Images`, reduce `formats`, use `onlyMainContent`

### Issue: Stale content
**Solution**: Set `maxAge: 0` or `storeInCache: false`

### Issue: Privacy concerns
**Solution**: Enable `zeroDataRetention` and `storeInCache: false`

## References

- [Firecrawl v2 API Documentation](https://docs.firecrawl.dev)
- [Firecrawl GitHub Repository](https://github.com/mendableai/firecrawl)
- [Advanced Scraping Guide](https://docs.firecrawl.dev/advanced-scraping-guide)
