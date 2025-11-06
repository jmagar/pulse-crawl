# Map Tool

The `map` tool rapidly discovers URLs from a website, providing fast sitemap generation and link discovery.

## Features

- **High performance**: 8x faster than crawling for URL discovery
- **Search filtering**: Find URLs containing specific keywords
- **Sitemap integration**: Use, skip, or exclusively use sitemaps
- **Subdomain handling**: Include or exclude subdomains
- **Large scale**: Support for up to 100,000 URLs per request

## Usage

### Basic URL Discovery

```json
{
  "url": "https://example.com",
  "limit": 100
}
```

### Filtered Discovery

```json
{
  "url": "https://example.com",
  "search": "documentation",
  "limit": 50
}
```

### Sitemap-Only Discovery

```json
{
  "url": "https://example.com",
  "sitemap": "only",
  "limit": 1000
}
```

## Parameters

| Parameter               | Type    | Required | Default   | Description                                 |
| ----------------------- | ------- | -------- | --------- | ------------------------------------------- |
| `url`                   | string  | Yes      | -         | Website URL to map                          |
| `search`                | string  | No       | -         | Filter URLs containing this keyword         |
| `limit`                 | number  | No       | 5000      | Maximum URLs to return (1-100,000)          |
| `sitemap`               | string  | No       | "include" | Sitemap handling: `skip`, `include`, `only` |
| `includeSubdomains`     | boolean | No       | true      | Include subdomain URLs                      |
| `ignoreQueryParameters` | boolean | No       | true      | Ignore URL query parameters                 |
| `timeout`               | number  | No       | -         | Request timeout in milliseconds             |
| `location`              | object  | No       | -         | Geographic location settings                |

### Location Options

| Option      | Type   | Default | Description                  |
| ----------- | ------ | ------- | ---------------------------- |
| `country`   | string | "US"    | Country code for the request |
| `languages` | array  | -       | Preferred languages          |

## Response Format

Returns an array of discovered URLs with optional metadata:

```json
{
  "success": true,
  "links": [
    {
      "url": "https://example.com/page1",
      "title": "Page 1 Title",
      "description": "Page description"
    },
    {
      "url": "https://example.com/page2",
      "title": "Page 2 Title"
    }
  ]
}
```

## Performance

Typical performance: **~1.4 seconds to discover 1,200+ links**

The map tool is optimized for speed and does not extract page content. It only discovers URLs.

## Use Cases

Use `map` when you need to:

- **Quick website structure overview**: Understand site organization without crawling
- **URL discovery before selective scraping**: Find URLs, then use `scrape` on specific pages
- **Sitemap generation**: Create comprehensive site maps
- **Link validation**: Check for broken or outdated links
- **Content inventory**: Catalog all pages on a site

## Examples

### Discover Documentation Pages

```json
{
  "url": "https://docs.example.com",
  "search": "api",
  "limit": 200
}
```

### Full Site Map with Subdomains

```json
{
  "url": "https://example.com",
  "includeSubdomains": true,
  "limit": 10000
}
```

### Fast Sitemap-Only Scan

```json
{
  "url": "https://example.com",
  "sitemap": "only",
  "ignoreQueryParameters": true,
  "limit": 5000
}
```

### Exclude Query Parameters

```json
{
  "url": "https://shop.example.com",
  "ignoreQueryParameters": true,
  "limit": 500
}
```

## Tips

- Use `map` before `crawl` to estimate the number of pages
- Apply `search` filter to find specific content areas before scraping
- Set `sitemap: "only"` for the fastest discovery on sites with sitemaps
- Use `ignoreQueryParameters: true` to avoid duplicate URLs
- Start with smaller limits and increase as needed
- Combine with `scrape` tool for targeted content extraction

## Comparison: Map vs Crawl

| Feature   | Map              | Crawl                     |
| --------- | ---------------- | ------------------------- |
| Speed     | Fast (8x faster) | Slower (extracts content) |
| Content   | URLs only        | Full page content         |
| Use case  | URL discovery    | Content extraction        |
| Max pages | 100,000          | 100,000                   |
| Credits   | Lower cost       | Higher cost               |

Use `map` when you only need URLs. Use `crawl` when you need the actual content from each page.
