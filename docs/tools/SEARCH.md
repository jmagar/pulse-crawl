# Search Tool

The `search` tool enables web searching with optional content scraping using Firecrawl's search API.

## Features

- **Multi-source search**: Web, images, and news
- **Category filtering**: GitHub repositories, research papers, PDFs
- **Content scraping**: Optionally scrape full content of search results
- **Geographic targeting**: Country and language preferences

## Usage

### Basic Search

```json
{
  "query": "web scraping best practices",
  "limit": 10
}
```

### Multi-Source Search

```json
{
  "query": "machine learning",
  "sources": ["web", "news"],
  "limit": 5
}
```

### Search with Content Scraping

```json
{
  "query": "firecrawl documentation",
  "limit": 3,
  "scrapeOptions": {
    "formats": ["markdown", "html"],
    "onlyMainContent": true
  }
}
```

### Category-Filtered Search

```json
{
  "query": "web scraping library",
  "categories": ["github"],
  "limit": 10
}
```

## Parameters

| Parameter           | Type    | Required | Default | Description                                   |
| ------------------- | ------- | -------- | ------- | --------------------------------------------- |
| `query`             | string  | Yes      | -       | Search term or query                          |
| `limit`             | number  | No       | 5       | Number of results (1-100)                     |
| `sources`           | array   | No       | -       | Result types: `web`, `images`, `news`         |
| `categories`        | array   | No       | -       | Category filters: `github`, `research`, `pdf` |
| `country`           | string  | No       | -       | Country code for geographic targeting         |
| `lang`              | string  | No       | "en"    | Language preference                           |
| `location`          | string  | No       | -       | Location for localized results                |
| `timeout`           | number  | No       | -       | Request timeout in milliseconds               |
| `ignoreInvalidURLs` | boolean | No       | false   | Skip invalid URLs in results                  |
| `scrapeOptions`     | object  | No       | -       | Options for scraping search results           |

### Scrape Options

When `scrapeOptions` is provided, the tool will scrape the full content of search results:

| Option               | Type    | Default | Description                                        |
| -------------------- | ------- | ------- | -------------------------------------------------- |
| `formats`            | array   | -       | Content formats: `markdown`, `html`, etc.          |
| `onlyMainContent`    | boolean | -       | Extract only main content, removing navigation/ads |
| `removeBase64Images` | boolean | true    | Remove base64-encoded images                       |
| `blockAds`           | boolean | true    | Block advertisements                               |
| `waitFor`            | number  | -       | Wait time in milliseconds before scraping          |
| `parsers`            | array   | -       | Custom parser configuration                        |

## Response Format

Returns search results as MCP resources with metadata including credits used.

### Simple Search Response

```json
{
  "success": true,
  "data": [
    {
      "url": "https://example.com/page1",
      "title": "Page Title",
      "description": "Page description",
      "markdown": "...", // If scrapeOptions provided
      "position": 1
    }
  ],
  "creditsUsed": 2
}
```

### Multi-Source Response

```json
{
  "success": true,
  "data": {
    "web": [...],
    "images": [...],
    "news": [...]
  },
  "creditsUsed": 5
}
```

## Rate Limits and Credits

- Base cost: 2 credits per 10 results (without scraping)
- Additional credits for content scraping based on formats requested
- See [Firecrawl pricing documentation](https://www.firecrawl.dev/pricing) for details

## Examples

### Find GitHub Repositories

```json
{
  "query": "web scraping typescript",
  "categories": ["github"],
  "limit": 5
}
```

### Search with Full Content

```json
{
  "query": "API documentation best practices",
  "limit": 3,
  "scrapeOptions": {
    "formats": ["markdown"],
    "onlyMainContent": true,
    "blockAds": true
  }
}
```

### Localized News Search

```json
{
  "query": "technology news",
  "sources": ["news"],
  "country": "US",
  "lang": "en",
  "limit": 10
}
```

## Tips

- Start with small limits (3-5) to conserve credits
- Use category filters to get more relevant results
- Enable scraping only when you need full content, not just links
- Combine with the `map` tool to discover URLs before searching specific content
- Use `ignoreInvalidURLs: true` for searches that might return broken links
