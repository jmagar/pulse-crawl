# Firecrawl Search Endpoint Research

**Date**: 2025-11-07
**Time**: 01:15 UTC
**Status**: Complete Research Report

---

## Executive Summary

Comprehensive analysis of Firecrawl's `/v2/search` endpoint reveals **13 total parameters**, of which pulse-fetch currently implements **11**. The implementation is feature-complete for most use cases, with 2 advanced parameters missing that provide niche functionality.

**Key Findings**:

- Current implementation covers ~85% of actively-used parameters
- 2 missing parameters: `tbs` (time-based search) and advanced `scrapeOptions` (agent-specific features)
- Documentation is accurate but could be expanded with examples
- No critical gaps in core functionality

---

## All Firecrawl Search Endpoint Parameters

### Complete Parameter List

| #   | Parameter            | Type    | Required | Default | Currently Exposed | Status              |
| --- | -------------------- | ------- | -------- | ------- | ----------------- | ------------------- |
| 1   | `query`              | string  | ✅ Yes   | -       | ✅ Yes            | IMPLEMENTED         |
| 2   | `limit`              | integer | No       | 5       | ✅ Yes            | IMPLEMENTED         |
| 3   | `sources`            | array   | No       | ["web"] | ✅ Yes            | IMPLEMENTED         |
| 4   | `categories`         | array   | No       | -       | ✅ Yes            | IMPLEMENTED         |
| 5   | `country`            | string  | No       | "US"    | ✅ Yes            | IMPLEMENTED         |
| 6   | `location`           | string  | No       | -       | ✅ Yes            | IMPLEMENTED         |
| 7   | `timeout`            | integer | No       | 60000   | ✅ Yes            | IMPLEMENTED         |
| 8   | `ignoreInvalidURLs`  | boolean | No       | false   | ✅ Yes            | IMPLEMENTED         |
| 9   | `tbs`                | string  | No       | -       | ❌ Missing        | **MISSING**         |
| 10  | `scrapeOptions`      | object  | No       | -       | ✅ Partial        | PARTIAL             |
| 11  | `lang`               | string  | No       | "en"    | ✅ Yes            | IMPLEMENTED (Local) |
| 12  | Authorization Header | string  | ✅ Yes   | -       | ✅ Yes            | IMPLEMENTED         |
| 13  | Content-Type Header  | string  | ✅ Yes   | -       | ✅ Yes            | IMPLEMENTED         |

**Legend**:

- ✅ Implemented = Exposed in tool schema and passed to API
- ❌ Missing = Not exposed in tool schema
- ⚠️ Partial = Exposed but incomplete implementation
- 🔶 Local Only = Only in client, not in MCP tool schema

---

## Detailed Parameter Analysis

### 1. QUERY (Implemented)

```typescript
query: z.string().min(1, 'Query is required');
```

**Status**: ✅ Complete
**Description**: Search term or query
**Operators Supported**: Google-style operators (site:, inurl:, intitle:, imagesize:, larger:, related:, etc.)
**No changes needed**

---

### 2. LIMIT (Implemented)

```typescript
limit: z.number().int().min(1).max(100).optional().default(5);
```

**Status**: ✅ Complete
**Range**: 1-100 results
**Default**: 5
**Cost**: 2 credits per 10 results (without scraping)
**No changes needed**

---

### 3. SOURCES (Implemented)

```typescript
sources: z.array(z.enum(['web', 'images', 'news'])).optional();
```

**Status**: ✅ Complete
**Options**:

- `web` - Standard search results
- `images` - Image search (with `imagesize:` and `larger:` operators)
- `news` - News-focused results

**Response Structure**:

- Single source → flat array
- Multiple sources → organized by source type: `{ web: [...], images: [...], news: [...] }`

**No changes needed**

---

### 4. CATEGORIES (Implemented)

```typescript
categories: z.array(z.enum(['github', 'research', 'pdf'])).optional();
```

**Status**: ✅ Complete
**Options**:

- `github` - Search within GitHub repositories, code, issues, documentation
- `research` - Academic/research websites (arXiv, Nature, IEEE, PubMed)
- `pdf` - Search for PDFs specifically

**Response**: Each result includes `category` field indicating source
**Can combine multiple categories in one search**
**No changes needed**

---

### 5. COUNTRY (Implemented)

```typescript
country: z.string().optional();
```

**Status**: ✅ Complete
**Format**: ISO country codes (US, DE, FR, JP, UK, CA, etc.)
**Default**: "US"
**Best Practice**: Use with `location` parameter for better results
**No changes needed**

---

### 6. LOCATION (Implemented)

```typescript
location: z.string().optional();
```

**Status**: ✅ Complete
**Format**: Geographic string (e.g., "San Francisco,California,United States" or "Germany")
**Best Practice**: Use with `country` parameter for better results
**Resource**: Complete list of supported locations at https://firecrawl.dev/search_locations.json
**No changes needed**

---

### 7. TIMEOUT (Implemented)

```typescript
timeout: z.number().int().positive().optional();
```

**Status**: ✅ Complete
**Unit**: Milliseconds
**Default**: 60000 (60 seconds)
**Use Case**: Control how long to wait for search results
**Example**: `timeout: 30000` for 30-second timeout
**No changes needed**

---

### 8. IGNOREVALIDURLS (Implemented)

```typescript
ignoreInvalidURLs: z.boolean().optional().default(false);
```

**Status**: ✅ Complete
**Purpose**: Excludes URLs that are invalid for other Firecrawl endpoints
**Use Case**: Useful when piping search results into scrape/crawl endpoints
**No changes needed**

---

### 9. TBS - TIME-BASED SEARCH (MISSING)

```
CURRENTLY NOT EXPOSED IN SCHEMA
```

**Status**: ❌ Missing
**Type**: string
**Purpose**: Filter results by time period
**Predefined Values**:

- `qdr:h` - Past hour
- `qdr:d` - Past 24 hours
- `qdr:w` - Past week
- `qdr:m` - Past month
- `qdr:y` - Past year

**Custom Date Ranges**:

```
Format: "cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY"
Example: "cdr:1,cd_min:12/1/2024,cd_max:12/31/2024"
```

**Documentation**: [https://docs.firecrawl.dev/features/search#time-based-search](https://docs.firecrawl.dev/features/search#time-based-search)

**Priority**: ⭐⭐⭐ HIGH - Commonly used for time-sensitive searches (news, research, recent updates)

---

### 10. SCRAPEOPTIONS (Partially Implemented)

```typescript
scrapeOptions: z.object({
  formats: z.array(z.string()).optional(),
  onlyMainContent: z.boolean().optional(),
  removeBase64Images: z.boolean().optional().default(true),
  blockAds: z.boolean().optional().default(true),
  waitFor: z.number().int().optional(),
  parsers: z.array(z.string()).optional(),
}).optional();
```

**Status**: ⚠️ Partial
**Supported**: 6 core options (above)
**Documentation**: [https://docs.firecrawl.dev/api-reference/endpoint/search](https://docs.firecrawl.dev/api-reference/endpoint/search) states "Every option in scrape endpoint is supported"

**Additional Scrape Options Available** (not currently exposed):

- `proxy` (string): "basic" or "stealth" (+4 credits per result for stealth)
- `wait` (number): Wait for selector before scraping
- `includeHtmlTags` (boolean): Include HTML tags in output
- `includeTables` (boolean): Extract table data
- `extractScreenshots` (boolean): Include screenshots
- `actions` (array): Interact with page before scraping

**Cost Considerations**:

- PDF parsing: 1 credit per page (can be expensive!)
- Stealth proxy: +4 credits per result
- JSON mode: +4 credits per result

**Priority**: ⭐⭐ MEDIUM - Advanced use cases only

---

### 11. LANG (Implemented - Local Only)

```typescript
lang: z.string().optional().default('en');
```

**Status**: 🔶 Implemented in client but NOT exposed in MCP tool schema
**Type**: string
**Default**: "en"
**Note**: Present in `FirecrawlSearchClient` but not in `searchOptionsSchema` for MCP tool
**Action Needed**: Add to schema if user-facing language selection is needed

**Priority**: ⭐ LOW - Most users want default English

---

### 12-13. AUTH & CONTENT-TYPE HEADERS (Implemented)

**Status**: ✅ Complete

- Authorization: Bearer token automatically added from `FIRECRAWL_API_KEY`
- Content-Type: application/json (hardcoded in client)

---

## Comparison: Current Implementation vs. API Specification

### What's Implemented (11/13 parameters)

✅ Core search functionality (query, limit, sources, categories)
✅ Geographic targeting (country, location)
✅ Advanced filtering (categories: github, research, pdf)
✅ Performance control (timeout, ignoreInvalidURLs)
✅ Content scraping basics (6 scrapeOptions)
✅ Client-level language support

### What's Missing (2 parameters)

| Gap                  | Parameter             | Impact                                                       | Effort to Add                             |
| -------------------- | --------------------- | ------------------------------------------------------------ | ----------------------------------------- |
| Time-based filtering | `tbs`                 | Can't filter by date ranges (common need for news, research) | **EASY** - 1 field addition               |
| Advanced scraping    | Extra `scrapeOptions` | Can't use stealth proxy, actions, screenshots, etc.          | **MEDIUM** - Multiple new optional fields |

### What's Incomplete

| Issue                      | Component                       | Impact                                                    | Notes                                                   |
| -------------------------- | ------------------------------- | --------------------------------------------------------- | ------------------------------------------------------- |
| Lang parameter not exposed | Schema vs Client mismatch       | Users can't override language preference                  | Simple fix - add to schema                              |
| scrapeOptions incomplete   | Only 6 of 10+ options available | Can't use advanced features (proxy, actions, screenshots) | Documentation says "all options supported" but not true |

---

## Recommendations

### PRIORITY 1: Add TBS (Time-Based Search)

**Effort**: Easy (1-2 hours)
**Impact**: High - Enables date-filtered searches
**Location**: `/shared/mcp/tools/search/schema.ts`

```typescript
// Add to searchOptionsSchema
tbs: z.string().optional(),
  // Predefined: 'qdr:h', 'qdr:d', 'qdr:w', 'qdr:m', 'qdr:y'
  // Custom: 'cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY'
```

**Use Case Examples**:

- Find recent news about a topic
- Search for articles from past week
- Find research papers from specific date range

**Documentation**: Add to `/docs/tools/SEARCH.md` with examples

---

### PRIORITY 2: Expose Lang Parameter in Schema

**Effort**: Trivial (10 minutes)
**Impact**: Low-Medium - Consistency between client and schema
**Location**: `/shared/mcp/tools/search/schema.ts`

```typescript
// Already in client, needs to be explicit in schema
lang: z.string().optional().default('en'),
```

**Note**: Currently working but not exposed in MCP tool schema

---

### PRIORITY 3: Expand ScrapOptions with Advanced Features

**Effort**: Medium (3-4 hours including tests)
**Impact**: Medium - Unlocks advanced scraping features
**Affected Options**:

```typescript
// Optional additions to scrapeOptions
proxy?: z.enum(['basic', 'stealth']),  // +4 credits for stealth
actions?: z.array(z.object({
  type: z.enum(['click', 'scroll', 'input', 'wait']),
  // ... action-specific properties
})),
extractScreenshots?: z.boolean(),
includeTables?: z.boolean(),
includeHtmlTags?: z.boolean(),
```

**Cost Warning**: Document that stealth proxy adds 4 credits per result

---

### PRIORITY 4: Improve Documentation

**Effort**: Easy (1 hour)
**Impact**: High - Better user understanding
**Changes to `/docs/tools/SEARCH.md`**:

1. Add TBS examples section:
   - Past 24 hours search
   - Past month search
   - Custom date range

2. Add Time-Based Search Cost section:
   - Cost implications of different search combinations
   - Examples of cost calculation

3. Add Advanced Scraping Options section:
   - When to use proxy modes
   - Screenshot extraction benefits
   - Table extraction use cases

4. Add Query Operator Examples:
   - Show Google-style operators supported
   - Date-based search syntax
   - Category filtering with operators

5. Cost Optimization Tips:
   - How to use `parsers: []` to skip PDF parsing
   - Using 'basic' proxy vs 'stealth'
   - Optimal limit settings for cost efficiency

---

## Missing Features That Firecrawl Has

### 1. Advanced Scraping Actions

Firecrawl supports `actions` (click, scroll, input, wait) to interact with pages before scraping. Currently not exposed.

**Example Use Case**:

```json
{
  "query": "javascript framework comparison",
  "limit": 3,
  "scrapeOptions": {
    "actions": [
      { "type": "wait", "milliseconds": 1000 },
      { "type": "click", "selector": ".load-more" },
      { "type": "wait", "milliseconds": 500 }
    ],
    "formats": ["markdown"]
  }
}
```

**Priority**: Low - Edge case for dynamic content in search results

---

### 2. Stealth Proxy Mode

For sites with strict anti-bot measures, use `proxy: "stealth"` (costs 4 extra credits per result).

**Status**: Not exposed, documented in Firecrawl but not recommended for search (typically used with scrape)

---

### 3. JSON Mode with Schema

Extract structured data from search results using Pydantic/JSON schemas.

**Status**: Not exposed for search endpoint (mentioned but incomplete in docs)

---

## Best Practices from Firecrawl Docs

1. **Combine country + location**: Best results when both set
2. **Start with small limits**: 3-5 results to conserve credits
3. **Use categories for relevance**: Filter by github/research/pdf for focused results
4. **Check search locations file**: https://firecrawl.dev/search_locations.json for exact location strings
5. **Cost optimization**:
   - Set `parsers: []` if you don't need PDF content
   - Use `proxy: "basic"` not "stealth" when possible
   - Limit results with `limit` parameter
6. **Invalid URL handling**: Use `ignoreInvalidURLs: true` when piping to scrape/crawl
7. **Time-sensitive searches**: Use `tbs` for news, recent updates, trending topics

---

## Implementation Roadmap

### Phase 1: Quick Wins (Session 1)

- [ ] Add `tbs` parameter to schema
- [ ] Expose `lang` parameter in schema
- [ ] Add time-based search examples to documentation
- [ ] Update parameter table in SEARCH.md

**Estimated Effort**: 1-2 hours
**Testing**: Update existing tests, add new time-based search test

---

### Phase 2: Enhanced Documentation (Session 2)

- [ ] Create examples for all TBS formats
- [ ] Add cost calculation guide
- [ ] Document query operators
- [ ] Add best practices section

**Estimated Effort**: 1 hour

---

### Phase 3: Advanced Features (Future)

- [ ] Expand scrapeOptions with proxy, actions, screenshots
- [ ] Add JSON mode support for structured extraction
- [ ] Performance optimization with custom timeout examples
- [ ] Test advanced features thoroughly

**Estimated Effort**: 4-5 hours

---

## Files Affected

### For TBS Addition:

- `/shared/mcp/tools/search/schema.ts` - Add `tbs` field
- `/shared/clients/firecrawl-search.client.ts` - Already supports it (pass-through)
- `/shared/mcp/tools/search/index.test.ts` - Add test cases
- `/docs/tools/SEARCH.md` - Add examples and explanation

### For Lang Exposure:

- `/shared/mcp/tools/search/schema.ts` - Add explicit `lang` field
- `/docs/tools/SEARCH.md` - Mention language support

### For Documentation:

- `/docs/tools/SEARCH.md` - Enhanced examples and best practices

---

## Testing Recommendations

### Test Cases to Add

1. **Time-Based Search**:
   - Predefined range: `tbs: "qdr:w"`
   - Custom date range: `tbs: "cdr:1,cd_min:01/01/2024,cd_max:01/31/2024"`
   - Verify results are filtered correctly

2. **Language Override**:
   - Default English search
   - Search with `lang: "de"` (German)
   - Verify language parameter is passed to API

3. **Edge Cases**:
   - Empty TBS string (should be ignored)
   - Invalid date format (API should reject)
   - TBS with images/news sources

---

## Summary Table

| Feature                           | Status     | Effort  | Impact | Priority |
| --------------------------------- | ---------- | ------- | ------ | -------- |
| Query, Limit, Sources, Categories | ✅ Done    | -       | -      | -        |
| Country, Location, Timeout        | ✅ Done    | -       | -      | -        |
| ignoreInvalidURLs                 | ✅ Done    | -       | -      | -        |
| **TBS (Time-Based Search)**       | ❌ Missing | Easy    | High   | 🔴 P1    |
| **Lang Parameter**                | 🔶 Partial | Trivial | Low    | 🟡 P2    |
| **Advanced scrapeOptions**        | ⚠️ Limited | Medium  | Medium | 🟡 P2    |
| **Documentation**                 | 🔶 Basic   | Easy    | High   | 🔴 P1    |
| Advanced Actions                  | ❌ Missing | High    | Low    | 🟢 P3    |
| Stealth Proxy                     | ❌ Missing | Easy    | Low    | 🟢 P3    |

---

## Conclusion

The Pulse Fetch search implementation is **85% feature-complete** with good coverage of core functionality. The two main gaps are:

1. **Time-based search (TBS)** - Easy to add, high value for users doing date-filtered searches
2. **Documentation** - Current docs are accurate but could be expanded with more examples and best practices

The implementation is production-ready for standard use cases. Advanced features (stealth proxy, actions, screenshots) are edge cases that can be added later if needed.

**Recommended Next Steps**:

1. Add TBS parameter support (1-2 hours)
2. Enhance documentation with examples (1 hour)
3. Update tests and changelog
4. Consider Phase 3 advanced features for future release
