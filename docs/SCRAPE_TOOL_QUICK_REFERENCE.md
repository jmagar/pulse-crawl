# SCRAPE Tool - Quick Reference

**All parameters at a glance for the SCRAPE tool**

## Required Parameters

| Parameter | Type   | Description           |
| --------- | ------ | --------------------- |
| `url`     | string | Webpage URL to scrape |

## Optional Parameters

| Parameter        | Type    | Default         | Options                                   |
| ---------------- | ------- | --------------- | ----------------------------------------- |
| `timeout`        | number  | 60000           | Any milliseconds (e.g., 30000, 120000)    |
| `maxChars`       | number  | 100000          | Any positive number                       |
| `startIndex`     | number  | 0               | Any non-negative number                   |
| `resultHandling` | string  | 'saveAndReturn' | 'returnOnly', 'saveAndReturn', 'saveOnly' |
| `forceRescrape`  | boolean | false           | true, false                               |
| `cleanScrape`    | boolean | true            | true, false                               |
| `extract`        | string  | —               | Any natural language query (LLM required) |

## Parameter Descriptions

**`url`** - Webpage URL  
Auto-adds https:// if missing, trims whitespace

**`timeout`** (ms) - Page load wait time  
Default 60s, increase for slow sites (e.g., 120000 for 2 minutes)

**`maxChars`** - Max content size  
Default 100k chars, use for pagination with `startIndex`

**`startIndex`** - Start character offset  
Used with `maxChars` for pagination (e.g., 100000 to skip first 100k)

**`resultHandling`** - How to return results

- `returnOnly`: Plain text, no saving
- `saveAndReturn`: Embed resource (default, enables caching)
- `saveOnly`: Save only, return link (bypasses cache)

**`forceRescrape`** - Bypass cache  
True = always fetch fresh, false = use cache if available

**`cleanScrape`** - Convert HTML to Markdown  
True = clean + convert (default), false = raw HTML (debugging)

**`extract`** - LLM-powered extraction  
Natural language query describing what to extract
Examples: "summarize in 3 bullets", "extract prices as JSON", etc.
Requires: ANTHROPIC_API_KEY, OPENAI_API_KEY, or LLM_API_BASE_URL

## Common Use Cases

### Basic Scrape

```json
{ "url": "https://example.com" }
```

### Get Fresh Content

```json
{
  "url": "https://example.com",
  "forceRescrape": true
}
```

### Extract Information

```json
{
  "url": "https://example.com",
  "extract": "summarize the main content in 3 bullet points"
}
```

### Pagination (Page 1)

```json
{
  "url": "https://example.com/docs",
  "maxChars": 50000,
  "startIndex": 0
}
```

### Pagination (Page 2)

```json
{
  "url": "https://example.com/docs",
  "maxChars": 50000,
  "startIndex": 50000
}
```

### Quick Return (No Save)

```json
{
  "url": "https://example.com",
  "resultHandling": "returnOnly"
}
```

### Debug Raw HTML

````json
{
  "url": "https://example.com",pulse-crawl
  "cleanScrape": false,pulse-crawl
  "resultHandling": "returnOnly"pulse-crawl
}pulse-crawl
```pulse-crawl

## File Locations

- **Schema + Types**: `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/schema.ts`
- **Implementation**: `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/handler.ts`
- **Pipeline**: `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/pipeline.ts`
- **Response**: `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/response.ts`
- **Tests**: `/home/jmagar/code/pulse-fetch/tests/functional/scrape-tool.test.ts`

## Key Facts

- **7 standard parameters** + 1 conditional (extract - requires LLM)
- **Parameters are immutable** once defined in schema.ts
- **All defaults are in one place**: PARAM_DESCRIPTIONS constant
- **Pagination**: Use startIndex + maxChars together
- **Caching**: Automatic with saveAndReturn/saveOnly, bypassed with forceRescrape
- **Cleaning**: Reduces HTML size by 50-90%, on by default
- **Extract**: Natural language queries, powered by LLM if available

## Environment Variables

Required for `extract` parameter:

- `ANTHROPIC_API_KEY` - For Anthropic Claude
- `OPENAI_API_KEY` - For OpenAI models
- `LLM_API_BASE_URL` + `LLM_API_KEY` - For compatible APIs

Optional:

- `LLM_MODEL` - Override default model version
````
