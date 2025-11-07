# SCRAPE Tool - Complete Parameter Reference

**Generated**: 2025-11-06  
**Codebase Status**: pulse-fetch MCP server  
**Scope**: All parameters exposed to end users

---

## Table of Contents

1. [Parameter Summary](#parameter-summary)
2. [Detailed Parameters](#detailed-parameters)
3. [Type Definitions](#type-definitions)
4. [Validation Rules](#validation-rules)
5. [Default Values](#default-values)
6. [File Locations](#file-locations)
7. [Response Handling](#response-handling)

---

## Parameter Summary

The SCRAPE tool exposes **7 core parameters** to users:

| Parameter        | Type    | Required | Default         | Conditional           |
| ---------------- | ------- | -------- | --------------- | --------------------- |
| `url`            | string  | ✅ Yes   | —               | No                    |
| `timeout`        | number  | No       | 60000           | No                    |
| `maxChars`       | number  | No       | 100000          | No                    |
| `startIndex`     | number  | No       | 0               | No                    |
| `resultHandling` | enum    | No       | 'saveAndReturn' | No                    |
| `forceRescrape`  | boolean | No       | false           | No                    |
| `cleanScrape`    | boolean | No       | true            | No                    |
| `extract`        | string  | No       | —               | ✅ Yes (requires LLM) |

**Total Parameters**: 8 (7 standard + 1 conditional)

---

## Detailed Parameters

### 1. URL (Required)

**Type**: `string`  
**Required**: Yes  
**Default**: None  
**Format**: Valid URI

**Description**:

> The webpage URL to scrape (e.g., "https://example.com/article", "https://api.example.com/docs")

**Processing**:

- Trims whitespace
- Auto-adds `https://` protocol if missing
- Validates URL format after preprocessing

**Example Values**:

```
"https://example.com"
"example.com"                    // Auto-converted to https://example.com
"https://docs.example.com/api"
" https://example.com "          // Whitespace trimmed
```

**Validation**:

- Must be a valid URL after preprocessing
- Protocol is required (will be added if missing)

---

### 2. Timeout

**Type**: `number`  
**Required**: No  
**Default**: `60000` (milliseconds, 1 minute)  
**Range**: Any positive integer

**Description**:

> Maximum time to wait for page load in milliseconds. Increase for slow-loading sites (e.g., 120000 for 2 minutes). Default: 60000 (1 minute)

**Use Cases**:

- JavaScript-heavy sites: 120000-180000 ms
- Normal sites: 60000 ms (default)
- Fast CDN sites: 30000 ms

**Example Values**:

```
30000    // 30 seconds (fast sites)
60000    // 60 seconds (default, recommended)
120000   // 2 minutes (slow-loading sites)
180000   // 3 minutes (very slow sites)
```

---

### 3. Max Characters

**Type**: `number`  
**Required**: No  
**Default**: `100000` (100 KB)  
**Range**: Any positive integer

**Description**:

> Maximum number of characters to return from the scraped content. Useful for limiting response size. Default: 100000

**Use Cases**:

- Limit response size for large pages
- Pagination through document content
- Stay within LLM context windows
- Cost control for API calls

**Example Values**:

```
10000    // 10 KB (small summary)
50000    // 50 KB (medium article)
100000   // 100 KB (default, most content)
500000   // 500 KB (long documents)
```

**Notes**:

- Works in combination with `startIndex` for pagination
- Truncation message appended if content exceeds this limit
- Only applied when `resultHandling` is NOT 'saveOnly'

---

### 4. Start Index

**Type**: `number`  
**Required**: No  
**Default**: `0`  
**Range**: Any non-negative integer

**Description**:

> Character position to start reading from. Use with maxChars for pagination through large documents (e.g., startIndex: 100000 to skip first 100k chars). Default: 0

**Use Cases**:

- Pagination through large documents
- Resume reading from previous position
- Extract specific sections of content

**Example Values**:

```
0        // Start from beginning (default)
50000    // Skip first 50k characters
100000   // Skip first 100k characters
250000   // Skip first 250k characters
```

**Pagination Example**:

```
// Request 1: Get first 100k chars
{ url: "...", maxChars: 100000, startIndex: 0 }

// Request 2: Get next 100k chars
{ url: "...", maxChars: 100000, startIndex: 100000 }

// Request 3: Get final 100k chars
{ url: "...", maxChars: 100000, startIndex: 200000 }
```

---

### 5. Result Handling

**Type**: `enum`  
**Required**: No  
**Default**: `'saveAndReturn'`  
**Allowed Values**:

- `'returnOnly'`
- `'saveAndReturn'`
- `'saveOnly'`

**Description**:

> How to handle scraped content and MCP Resources. Options: "saveOnly" (saves as linked resource, no content returned), "saveAndReturn" (saves as embedded resource and returns content - default), "returnOnly" (returns content without saving). Default: "saveAndReturn"

**Mode Details**:

#### `'returnOnly'`

- Returns content as plain text
- Does NOT save to resource storage
- Bypasses all caching logic
- Best for: One-off scrapes, temporary content

**Response Format**:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Article content here...\n\n---\nScraped using: native"
    }
  ]
}
```

#### `'saveAndReturn'` (Default)

- Saves content as MCP Resource
- Returns content as embedded resource
- Best for: Reusable content, follow-up analysis
- Enables: Caching on future requests

**Response Format**:

```json
{
  "content": [
    {
      "type": "resource",
      "resource": {
        "uri": "scraped://example.com/article_2024-01-15T10:30:00Z",
        "name": "https://example.com/article",
        "text": "Full article content..."
      }
    }
  ]
}
```

#### `'saveOnly'`

- Saves content to resource storage
- Returns only resource link (no content)
- Bypasses cache on fetch (always fetches fresh)
- Best for: Large documents, background processing

**Response Format**:

```json
{
  "content": [
    {
      "type": "resource_link",
      "uri": "scraped://example.com/article_2024-01-15T10:30:00Z",
      "name": "https://example.com/article"
    }
  ]
}
```

---

### 6. Force Rescrape

**Type**: `boolean`  
**Required**: No  
**Default**: `false`  
**Allowed Values**: `true`, `false`

**Description**:

> Force a fresh scrape even if cached content exists for this URL. Useful when you know the content has changed. Default: false

**Cache Behavior**:

- `false` (default): Return cached content if available
- `true`: Always fetch fresh, bypass cache
- When true: Automatically bypasses cache lookup

**Use Cases**:

- Monitor page changes
- Refresh stale cached data
- Force re-extraction with different query
- Debug scraping issues

**Example**:

```
// First request - caches result
{ url: "https://news.example.com/article" }

// Second request - returns cached (instant)
{ url: "https://news.example.com/article" }

// Third request - fetches fresh
{ url: "https://news.example.com/article", forceRescrape: true }
```

---

### 7. Clean Scrape

**Type**: `boolean`  
**Required**: No  
**Default**: `true`  
**Allowed Values**: `true`, `false`

**Description**:

> Whether to clean the scraped content by converting HTML to semantic Markdown of what's on the page, removing ads, navigation, and boilerplate. This typically reduces content size by 50-90% while preserving main content. Only disable this for debugging or when you need the exact raw HTML structure. Default: true

**Cleaning Pipeline**:
When `true`:

1. Converts HTML to semantic Markdown
2. Removes navigation elements
3. Removes advertisements
4. Removes boilerplate content (footers, cookie banners, etc.)
5. Reduces typical size by 50-90%
6. Improves LLM processing

**Use Cases**:

- `true` (default): Normal scraping, LLM extraction
- `false`: Debugging, need raw HTML, special parsing

**Performance Impact**:

- Cleaning adds ~200-500ms processing time
- Usually worth it due to size reduction

---

### 8. Extract (Conditional)

**Type**: `string`  
**Required**: No (unless LLM available)  
**Default**: None  
**Conditional**: Only available if `ExtractClientFactory.isAvailable()` returns `true`

**Availability Conditions**:

```typescript
// Available when ANY of these are set:
- ANTHROPIC_API_KEY
- OPENAI_API_KEY
- LLM_API_BASE_URL (with compatible provider)
```

**Description**:

> Natural language query for intelligent content extraction. Describe what information you want extracted from the scraped page.

**Parameter Categories**:

#### Simple Data Extraction

```
"the author name and publication date"
"all email addresses mentioned on the page"
"the main product price and availability status"
"company address and phone number"
```

#### Formatted Extraction (Specify Output Format)

```
"summarize the main article in 3 bullet points"
"extract the recipe ingredients as a markdown list"
"get the pricing tiers as a comparison table in markdown"
"extract all testimonials with customer names and quotes formatted as markdown blockquotes"
```

#### Structured Data Extraction (JSON)

```
"extract product details as JSON with fields: name, price, description, specifications"
"get all job listings as JSON array with title, location, salary, and requirements"
"extract the FAQ section as JSON with question and answer pairs"
"parse the contact information into JSON format with fields for address, phone, email, and hours"
```

#### Complex Queries

```
"analyze the sentiment of customer reviews and categorize them as positive, negative, or neutral"
"extract and summarize the key features of the product, highlighting unique selling points"
"identify all dates mentioned and what events they relate to"
"extract technical specifications and explain them in simple terms"
```

**LLM Provider Requirements**:

- Anthropic Claude (default): `ANTHROPIC_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- OpenAI-compatible: `LLM_API_BASE_URL` + `LLM_API_KEY`

**Model Configuration**:

- Default: Latest Claude model
- Override: `LLM_MODEL` environment variable

---

## Type Definitions

### Zod Schema

**File**: `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/schema.ts`

```typescript
export const buildScrapeArgsSchema = () => {
  const baseSchema = {
    url: z
      .string()
      .transform(preprocessUrl)
      .pipe(z.string().url())
      .describe(PARAM_DESCRIPTIONS.url),

    timeout: z.number().optional().default(60000).describe(PARAM_DESCRIPTIONS.timeout),

    maxChars: z.number().optional().default(100000).describe(PARAM_DESCRIPTIONS.maxChars),

    startIndex: z.number().optional().default(0).describe(PARAM_DESCRIPTIONS.startIndex),

    resultHandling: z
      .enum(['saveOnly', 'saveAndReturn', 'returnOnly'])
      .optional()
      .default('saveAndReturn')
      .describe(PARAM_DESCRIPTIONS.resultHandling),

    forceRescrape: z.boolean().optional().default(false).describe(PARAM_DESCRIPTIONS.forceRescrape),

    cleanScrape: z.boolean().optional().default(true).describe(PARAM_DESCRIPTIONS.cleanScrape),
  };

  // Conditionally include extract if LLM available
  if (ExtractClientFactory.isAvailable()) {
    return z.object({
      ...baseSchema,
      extract: z.string().optional().describe(PARAM_DESCRIPTIONS.extract),
    });
  }

  return z.object(baseSchema);
};
```

### MCP Input Schema

```typescript
export const buildInputSchema = () => {
  const baseProperties = {
    url: {
      type: 'string',
      format: 'uri',
      description: PARAM_DESCRIPTIONS.url,
    },
    timeout: {
      type: 'number',
      default: 60000,
      description: PARAM_DESCRIPTIONS.timeout,
    },
    maxChars: {
      type: 'number',
      default: 100000,
      description: PARAM_DESCRIPTIONS.maxChars,
    },
    startIndex: {
      type: 'number',
      default: 0,
      description: PARAM_DESCRIPTIONS.startIndex,
    },
    resultHandling: {
      type: 'string',
      enum: ['saveOnly', 'saveAndReturn', 'returnOnly'],
      default: 'saveAndReturn',
      description: PARAM_DESCRIPTIONS.resultHandling,
    },
    forceRescrape: {
      type: 'boolean',
      default: false,
      description: PARAM_DESCRIPTIONS.forceRescrape,
    },
    cleanScrape: {
      type: 'boolean',
      default: true,
      description: PARAM_DESCRIPTIONS.cleanScrape,
    },
  };

  if (ExtractClientFactory.isAvailable()) {
    return {
      type: 'object' as const,
      properties: {
        ...baseProperties,
        extract: {
          type: 'string',
          description: PARAM_DESCRIPTIONS.extract,
        },
      },
      required: ['url'],
    };
  }

  return {
    type: 'object' as const,
    properties: baseProperties,
    required: ['url'],
  };
};
```

### TypeScript Interfaces

**File**: `/home/jmagar/code/pulse-fetch/shared/types.ts`

```typescript
export type ResultHandling = 'saveOnly' | 'saveAndReturn' | 'returnOnly';

export interface ScrapeOptions {
  timeout?: number;
  extract?: string;
  maxChars?: number;
  startIndex?: number;
  resultHandling?: ResultHandling;
}

export interface ScrapePipelineOptions {
  url: string;
  timeout: number;
  maxChars: number;
  startIndex: number;
  resultHandling: 'saveOnly' | 'saveAndReturn' | 'returnOnly';
  forceRescrape: boolean;
  cleanScrape: boolean;
  extract?: string;
}
```

---

## Validation Rules

### URL Validation

**Function**: `preprocessUrl()`  
**Location**: `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/schema.ts:81-91`

```typescript
export function preprocessUrl(url: string): string {
  // Trim whitespace
  url = url.trim();

  // If no protocol is specified, add https://
  if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)) {
    url = 'https://' + url;
  }

  return url;
}
```

**Validation Steps**:

1. Trim whitespace from input
2. If protocol missing, prepend `https://`
3. Validate with Zod's `.url()` validator

**Valid Examples**:

- `"https://example.com"` ✅ Already has protocol
- `"example.com"` ✅ Protocol added automatically
- `"http://example.com"` ✅ Protocol preserved
- `" https://example.com "` ✅ Whitespace trimmed

**Invalid Examples**:

- `"not a url"` ❌ Not a valid URL format
- `"://broken"` ❌ Invalid protocol

### Timeout Validation

**Rules**:

- Must be a positive number
- Type: `number` only (no strings)
- No upper limit enforced

### MaxChars Validation

**Rules**:

- Must be a positive number
- Type: `number` only
- No upper limit enforced
- Works with `startIndex` for pagination

### StartIndex Validation

**Rules**:

- Must be non-negative number (≥ 0)
- Type: `number` only
- Typical range: 0 to content length

### Result Handling Validation

**Rules**:

- Must be one of: `'saveOnly'`, `'saveAndReturn'`, `'returnOnly'`
- Enum validation enforced by Zod
- Case-sensitive

### Force Rescrape Validation

**Rules**:

- Must be boolean (`true` or `false`)
- Bypasses cache when `true`

### Clean Scrape Validation

**Rules**:

- Must be boolean (`true` or `false`)
- Triggers HTML-to-Markdown conversion when `true`

### Extract Validation

**Rules**:

- Must be string (any length)
- Only validated/processed when `ExtractClientFactory.isAvailable()` is `true`
- If provided without LLM available: Parameter ignored (not in schema)
- Can be any natural language query

---

## Default Values

**Summary Table**:

| Parameter        | Default           | Rationale                            |
| ---------------- | ----------------- | ------------------------------------ |
| `url`            | — (required)      | Must be specified by user            |
| `timeout`        | `60000` ms        | Reasonable for most websites         |
| `maxChars`       | `100000`          | Fits most content + LLM context      |
| `startIndex`     | `0`               | Start from beginning by default      |
| `resultHandling` | `'saveAndReturn'` | Best for reuse + caching             |
| `forceRescrape`  | `false`           | Use cache for performance            |
| `cleanScrape`    | `true`            | Better content for LLM               |
| `extract`        | — (optional)      | No extraction without explicit query |

**Default Generation**:

- Zod `.default()` method sets defaults
- MCP schema `default:` property documents them
- Applied during argument parsing in `buildScrapeArgsSchema()`

---

## File Locations

### Core Implementation

| File                                                                | Purpose                                           |
| ------------------------------------------------------------------- | ------------------------------------------------- |
| `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/schema.ts`   | **Primary** - Zod schemas & parameter definitions |
| `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/handler.ts`  | Argument validation & orchestration               |
| `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/index.ts`    | Tool registration                                 |
| `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/pipeline.ts` | Processing pipeline                               |
| `/home/jmagar/code/pulse-fetch/shared/mcp/tools/scrape/response.ts` | Response formatting                               |
| `/home/jmagar/code/pulse-fetch/shared/types.ts`                     | TypeScript interfaces                             |

### Parameter Descriptions

**Single Source of Truth**: `PARAM_DESCRIPTIONS` constant in `schema.ts`

```typescript
export const PARAM_DESCRIPTIONS = {
  url: '...',
  timeout: '...',
  maxChars: '...',
  startIndex: '...',
  resultHandling: '...',
  forceRescrape: '...',
  cleanScrape: '...',
  extract: '...',
} as const;
```

**Usage**:

- Zod schema descriptions
- MCP input schema descriptions
- Documentation consistency

### Testing Files

| File                                                                      | Coverage         |
| ------------------------------------------------------------------------- | ---------------- |
| `/home/jmagar/code/pulse-fetch/tests/functional/scrape-tool.test.ts`      | Functional tests |
| `/home/jmagar/code/pulse-fetch/tests/manual/features/scrape-tool.test.ts` | Manual tests     |

### Configuration

| File                                                   | Purpose                     |
| ------------------------------------------------------ | --------------------------- |
| `/home/jmagar/code/pulse-fetch/docs/SCRAPE_OPTIONS.md` | Firecrawl options reference |
| `/home/jmagar/code/pulse-fetch/CLAUDE.md`              | Project documentation       |

---

## Response Handling

### Response Structure

The scrape tool returns different response structures based on `resultHandling`:

**Format**: All responses are MCP ToolResponse objects:

```typescript
interface ToolResponse {
  content: ResponseContent[];
  isError?: boolean;
}

interface ResponseContent {
  type: string;
  text?: string;
  uri?: string;
  name?: string;
  resource?: {
    uri: string;
    name?: string;
    text?: string;
  };
}
```

### Return Mode Examples

#### returnOnly

```json
{
  "content": [
    {
      "type": "text",
      "text": "Article content here...\n\n---\nScraped using: native"
    }
  ]
}
```

#### saveAndReturn (Default)

```json
{
  "content": [
    {
      "type": "resource",
      "resource": {
        "uri": "scraped://example.com/article_2024-01-15T10:30:00Z",
        "name": "https://example.com/article",
        "mimeType": "text/markdown",
        "description": "Scraped content from https://example.com/article",
        "text": "Article content..."
      }
    }
  ]
}
```

#### saveOnly

```json
{
  "content": [
    {
      "type": "resource_link",
      "uri": "scraped://example.com/article_2024-01-15T10:30:00Z",
      "name": "https://example.com/article",
      "mimeType": "text/markdown",
      "description": "Scraped content from https://example.com/article"
    }
  ]
}
```

### Error Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "Failed to scrape https://example.com\n\nDiagnostics:\n- Strategies attempted: native, firecrawl\n- Strategy errors:\n  - native: Connection timeout\n  - firecrawl: API rate limited\n- Timing:\n  - native: 5000ms\n  - firecrawl: 3000ms"
    }
  ],
  "isError": true
}
```

### Pagination Handling

When content exceeds `maxChars`:

```
Original content (500k chars)
↓
Apply startIndex=100000 → Skip first 100k
↓
Apply maxChars=50000 → Take next 50k
↓
Result: Characters 100k-150k

Response includes:
"[Content truncated at 50000 characters.
  Use startIndex parameter to continue reading
  from character 150000]"
```

---

## Parameter Interaction Examples

### Basic Scrape

```json
{
  "url": "https://example.com/article"
}
```

Result: Fetches from cache if available, cleans HTML, returns embedded resource

### Fresh Scrape with Extraction

```json
{
  "url": "https://example.com/article",
  "forceRescrape": true,
  "extract": "summarize this article in 3 bullet points"
}
```

Result: Fetches fresh, cleans HTML, extracts with LLM, saves extracted version, returns resource

### Large Document Pagination (Request 1)

```json
{
  "url": "https://example.com/docs",
  "maxChars": 50000,
  "startIndex": 0,
  "resultHandling": "returnOnly"
}
```

Result: Returns first 50k chars as plain text, no saving

### Large Document Pagination (Request 2)

```json
{
  "url": "https://example.com/docs",
  "maxChars": 50000,
  "startIndex": 50000,
  "resultHandling": "returnOnly"
}
```

Result: Returns characters 50k-100k as plain text

### Background Scrape

```json
{
  "url": "https://example.com",
  "resultHandling": "saveOnly"
}
```

Result: Fetches fresh, saves to storage, returns only link (no content in response)

### Debug Raw HTML

```json
{
  "url": "https://example.com",
  "cleanScrape": false,
  "maxChars": 10000,
  "resultHandling": "returnOnly"
}
```

Result: Returns raw HTML (first 10k chars) as plain text

---

## Summary

The SCRAPE tool provides a comprehensive set of parameters for flexible web scraping:

- **7 always-available parameters** for URL scraping, caching, pagination, and result handling
- **1 conditional parameter** for LLM-powered content extraction (requires API key)
- **3 result modes** (returnOnly, saveAndReturn, saveOnly) for different use cases
- **Smart caching** with forceRescrape bypass option
- **Content cleaning** (HTML → Markdown) with optional toggle
- **Pagination support** via startIndex/maxChars for large documents
- **Detailed descriptions** for each parameter in code and MCP schema

All parameters are centrally defined in `schema.ts` and consistently exposed through Zod validation and MCP input schemas.
