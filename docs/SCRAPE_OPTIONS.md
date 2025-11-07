# Firecrawl Default Scrape Options for Pulse Fetch

**Last Updated**: 2025-11-06
**Firecrawl API Version**: v2
**Research Status**: ✅ Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Recommended Default Configuration](#recommended-default-configuration)
3. [Format Options](#format-options)
4. [Content Extraction](#content-extraction)
5. [URL Filtering](#url-filtering)
6. [Performance & Caching](#performance--caching)
7. [Advanced Features](#advanced-features)
8. [Common Use Cases](#common-use-cases)
9. [Implementation Notes](#implementation-notes)

---

## Overview

This document defines the default scrape options for Pulse Fetch's Firecrawl integration. These settings are optimized for:

- LLM-ready content extraction
- Change tracking and monitoring
- Clean, efficient scraping
- Language variant exclusion (English-first)
- Cost-effective API usage

---

## Recommended Default Configuration

### Base Configuration

```json
{
  "url": "https://example.com",
  "formats": ["markdown", "html"],
  "onlyMainContent": true,
  "removeBase64Images": true,
  "blockAds": true,
  "waitFor": 2000,
  "timeout": 45000,
  "proxy": "auto",
  "location": {
    "country": "US",
    "languages": ["en-US", "en"]
  },
  "maxAge": 172800000,
  "storeInCache": true
}
```

### With Change Tracking

```json
{
  "url": "https://example.com",
  "formats": [
    "markdown",
    "html",
    {
      "type": "changeTracking",
      "modes": ["git-diff"],
      "tag": "production"
    }
  ],
  "onlyMainContent": true,
  "removeBase64Images": true,
  "blockAds": true,
  "waitFor": 2000,
  "timeout": 45000,
  "proxy": "auto",
  "maxAge": 0
}
```

### With Summary

```json
{
  "url": "https://example.com",
  "formats": ["markdown", "html", "summary"],
  "onlyMainContent": true,
  "waitFor": 2000
}
```

---

## Format Options

### Default Formats

| Format             | Include     | Purpose                 | Output Key            |
| ------------------ | ----------- | ----------------------- | --------------------- |
| **markdown**       | ✅ Always   | Clean LLM-ready content | `data.markdown`       |
| **html**           | ✅ Default  | Debugging & reference   | `data.html`           |
| **summary**        | ⚙️ Optional | Concise page summary    | `data.summary`        |
| **changeTracking** | ⚙️ Optional | Git-diff monitoring     | `data.changeTracking` |

### Available Additional Formats

| Format       | Purpose               | Output Key        |
| ------------ | --------------------- | ----------------- |
| `rawHtml`    | Unmodified HTML       | `data.rawHtml`    |
| `links`      | All hyperlinks        | `data.links`      |
| `images`     | All image URLs        | `data.images`     |
| `screenshot` | Visual capture        | `data.screenshot` |
| `json`       | Structured extraction | `data.json`       |
| `branding`   | Design system data    | `data.branding`   |

### Change Tracking Configuration

```json
{
  "type": "changeTracking",
  "modes": ["git-diff"],
  "tag": "production"
}
```

**Options:**

- `modes`: `["git-diff"]` (free) or `["json"]` (5 credits/page)
- `tag`: Separates environments (production, staging, dev)
- **Important**: Must include `"markdown"` format alongside changeTracking

**Status Values**: `"new"`, `"same"`, `"changed"`, `"removed"`

---

## Content Extraction

### Main Content Extraction

```json
{
  "onlyMainContent": true,
  "removeBase64Images": true,
  "blockAds": true
}
```

**Defaults:**

- `onlyMainContent`: `true` - Extracts main content only (excludes nav, footer, ads)
- `removeBase64Images`: `true` - Reduces payload size
- `blockAds`: `true` - Blocks ads and cookie popups

### Tag-Based Filtering

**Include Specific Tags:**

```json
{
  "includeTags": ["h1", "h2", "p", "article", ".main-content", "#article"]
}
```

**Exclude Specific Tags:**

```json
{
  "excludeTags": ["nav", "footer", "#ad", ".sidebar", ".cookie-banner"]
}
```

### PDF Parsing

```json
{
  "parsers": [{ "type": "pdf", "maxPages": 50 }]
}
```

**Default**: PDF content extracted as markdown (1 credit per page)
**Cost Control**: Set `maxPages` to limit parsing costs

---

## URL Filtering

### Excluding Language Variants

**Comprehensive Language Exclusion:**

```json
{
  "excludePaths": [
    "^/ar/", // Arabic
    "^/cs/", // Czech
    "^/de/", // German
    "^/es/", // Spanish
    "^/fr/", // French
    "^/he/", // Hebrew
    "^/hi/", // Hindi
    "^/id/", // Indonesian
    "^/it/", // Italian
    "^/ja/", // Japanese
    "^/ko/", // Korean
    "^/nl/", // Dutch
    "^/pl/", // Polish
    "^/pt/", // Portuguese
    "^/pt-BR/", // Brazilian Portuguese
    "^/ru/", // Russian
    "^/sv/", // Swedish
    "^/th/", // Thai
    "^/tr/", // Turkish
    "^/uk/", // Ukrainian
    "^/vi/", // Vietnamese
    "^/zh/", // Chinese
    "^/zh-CN/", // Simplified Chinese
    "^/zh-TW/" // Traditional Chinese
  ]
}
```

**Pattern-Based Language Exclusion:**

```json
{
  "excludePaths": [
    "^/[a-z]{2}/.*$", // Any 2-letter language code
    "^/[a-z]{2}-[A-Z]{2}/.*$" // Any locale code (en-US, pt-BR)
  ]
}
```

### Common Path Exclusions

```json
{
  "excludePaths": [
    "^/login/.*$",
    "^/register/.*$",
    "^/auth/.*$",
    "^/account/.*$",
    "^/checkout/.*$",
    "^/cart/.*$",
    "^/admin/.*$",
    "^/wp-admin/.*$",
    ".*\\.pdf$",
    ".*\\.zip$",
    ".*\\.exe$"
  ]
}
```

### Including Specific Paths

```json
{
  "includePaths": ["^/docs/.*$", "^/api-reference/.*$", "^/blog/.*$"]
}
```

### Query Parameter Handling

```json
{
  "ignoreQueryParameters": true
}
```

**Default**: `true` (recommended)
**Purpose**: Treat URLs with different query params as same page (reduces duplicates)

---

## Performance & Caching

### Timing Configuration

```json
{
  "waitFor": 2000,
  "timeout": 45000
}
```

**Defaults:**

- `waitFor`: `2000ms` - Delay before scraping (for dynamic content)
- `timeout`: `45000ms` - Maximum request duration (increased from 30s default)

**Use Cases:**

- JavaScript-heavy sites: `waitFor: 3000-5000ms`
- Slow-loading pages: `timeout: 60000ms`

### Caching Strategy

```json
{
  "maxAge": 172800000,
  "storeInCache": true
}
```

**Defaults:**

- `maxAge`: `172800000ms` (2 days) - Return cached version if available
- `storeInCache`: `true` - Store in Firecrawl cache

**Force Fresh Scrape:**

```json
{
  "maxAge": 0
}
```

### Proxy Configuration

```json
{
  "proxy": "auto"
}
```

**Options:**

- `"basic"` - Standard proxies (standard cost)
- `"stealth"` - Advanced anti-bot bypass (up to 5x cost)
- `"auto"` - Automatic fallback to stealth if basic fails (recommended)

---

## Advanced Features

### Location & Mobile

```json
{
  "location": {
    "country": "US",
    "languages": ["en-US", "en"]
  },
  "mobile": false
}
```

**Supported Countries**: 19 total (US, GB, AU, BR, CA, CN, CZ, DE, FR, IL, IN, IT, JP, PL, PT, QA, TR, AE, VN)
**Stealth Support**: Only 6 countries (AU, BR, DE, FR, US, VN)

### Custom Headers

```json
{
  "headers": {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    "Cookie": "session=abc123"
  }
}
```

### Browser Actions

```json
{
  "actions": [
    { "type": "wait", "milliseconds": 1000 },
    { "type": "click", "selector": ".accept-cookies" },
    { "type": "wait", "milliseconds": 500 },
    { "type": "write", "selector": "#search-box", "text": "query" },
    { "type": "press", "key": "Enter" },
    { "type": "wait", "milliseconds": 2000 }
  ]
}
```

**Action Types**: wait, click, write, press, scroll, screenshot, scrape, executeJavascript, pdf

---

## Common Use Cases

### Documentation Site (English Only)

```json
{
  "url": "https://docs.example.com",
  "formats": ["markdown", "html"],
  "excludePaths": ["^/[a-z]{2}/.*$", "^/[a-z]{2}-[A-Z]{2}/.*$"],
  "includePaths": ["^/docs/.*$"],
  "onlyMainContent": true,
  "waitFor": 2000,
  "timeout": 45000
}
```

### Price Monitoring with Change Tracking

```json
{
  "url": "https://example.com/product",
  "formats": [
    "markdown",
    {
      "type": "changeTracking",
      "modes": ["json"],
      "schema": {
        "type": "object",
        "properties": {
          "price": { "type": "number" },
          "inStock": { "type": "boolean" }
        }
      },
      "tag": "production"
    }
  ],
  "onlyMainContent": true,
  "maxAge": 0
}
```

### Dynamic Content with Actions

```json
{
  "url": "https://example.com/search",
  "formats": ["markdown", "screenshot"],
  "actions": [
    { "type": "wait", "milliseconds": 1000 },
    { "type": "click", "selector": ".cookie-accept" },
    { "type": "write", "selector": "#search-input", "text": "query" },
    { "type": "press", "key": "Enter" },
    { "type": "wait", "milliseconds": 3000 }
  ],
  "timeout": 60000
}
```

---

## Implementation Notes

### Pulse Fetch MCP Server Defaults

**Recommended Parameter Exposure:**

```typescript
interface ScrapeOptions {
  url: string; // Required
  formats?: string[]; // Default: ["markdown", "html"]
  onlyMainContent?: boolean; // Default: true
  removeBase64Images?: boolean; // Default: true
  blockAds?: boolean; // Default: true
  waitFor?: number; // Default: 2000
  timeout?: number; // Default: 45000
  proxy?: 'basic' | 'stealth' | 'auto'; // Default: "auto"
  maxAge?: number; // Default: 172800000 (2 days)
  excludePaths?: string[]; // Default: language exclusions
  includePaths?: string[]; // Default: []
  ignoreQueryParameters?: boolean; // Default: true
}
```

### Helper Patterns

```typescript
const EXCLUSION_PATTERNS = {
  languages: [
    '^/ar/',
    '^/cs/',
    '^/de/',
    '^/es/',
    '^/fr/',
    '^/he/',
    '^/hi/',
    '^/id/',
    '^/it/',
    '^/ja/',
    '^/ko/',
    '^/nl/',
    '^/pl/',
    '^/pt/',
    '^/pt-BR/',
    '^/ru/',
    '^/sv/',
    '^/th/',
    '^/tr/',
    '^/uk/',
    '^/vi/',
    '^/zh/',
    '^/zh-CN/',
    '^/zh-TW/',
  ],
  languagePatterns: ['^/[a-z]{2}/.*$', '^/[a-z]{2}-[A-Z]{2}/.*$'],
  auth: ['^/login/.*$', '^/register/.*$', '^/auth/.*$', '^/account/.*$'],
  admin: ['^/admin/.*$', '^/wp-admin/.*$'],
  files: ['.*\\.pdf$', '.*\\.zip$', '.*\\.exe$'],
};
```

### Validation Rules

1. **Regex Validation**: Validate `excludePaths` and `includePaths` patterns before API calls
2. **Conflict Detection**: Warn when `includePaths` and `excludePaths` might conflict
3. **Cost Warnings**: Alert users when using expensive options (stealth proxy, JSON changeTracking)
4. **Format Requirements**: Ensure `"markdown"` is included when using `changeTracking`

---

## Research References

- [Firecrawl Core Scrape Options Research](/home/jmagar/code/pulse-crawl/firecrawl-scrape-options-research.md)
- [Firecrawl URL Filtering Research](/home/jmagar/code/pulse-crawl/firecrawl-url-filtering-research.md)
- [Official Firecrawl API Documentation](https://docs.firecrawl.dev)
- [Firecrawl v2 Scrape Endpoint](https://docs.firecrawl.dev/api-reference/endpoint/scrape)
- [Firecrawl Advanced Scraping Guide](https://docs.firecrawl.dev/advanced-scraping-guide)

---

**Document Status**: ✅ Complete
**Last Review**: 2025-11-06
**Next Review**: When Firecrawl releases v3 or major feature updates
