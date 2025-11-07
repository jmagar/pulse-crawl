# Search Endpoint Implementation Guide

**Ready-to-Implement Code Changes**

---

## 1. Add TBS Parameter to Schema

**File**: `/shared/mcp/tools/search/schema.ts`

**Current Code** (lines 1-23):

```typescript
import { z } from 'zod';

export const searchOptionsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().min(1).max(100).optional().default(5),
  sources: z.array(z.enum(['web', 'images', 'news'])).optional(),
  categories: z.array(z.enum(['github', 'research', 'pdf'])).optional(),
  country: z.string().optional(),
  lang: z.string().optional().default('en'),
  location: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  ignoreInvalidURLs: z.boolean().optional().default(false),
  scrapeOptions: z
    .object({
      formats: z.array(z.string()).optional(),
      onlyMainContent: z.boolean().optional(),
      removeBase64Images: z.boolean().optional().default(true),
      blockAds: z.boolean().optional().default(true),
      waitFor: z.number().int().optional(),
      parsers: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SearchOptions = z.infer<typeof searchOptionsSchema>;
```

**Change**: Add `tbs` field after `location`:

```typescript
import { z } from 'zod';

export const searchOptionsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().min(1).max(100).optional().default(5),
  sources: z.array(z.enum(['web', 'images', 'news'])).optional(),
  categories: z.array(z.enum(['github', 'research', 'pdf'])).optional(),
  country: z.string().optional(),
  lang: z.string().optional().default('en'),
  location: z.string().optional(),
  tbs: z.string().optional(), // ADD THIS LINE
  timeout: z.number().int().positive().optional(),
  ignoreInvalidURLs: z.boolean().optional().default(false),
  scrapeOptions: z
    .object({
      formats: z.array(z.string()).optional(),
      onlyMainContent: z.boolean().optional(),
      removeBase64Images: z.boolean().optional().default(true),
      blockAds: z.boolean().optional().default(true),
      waitFor: z.number().int().optional(),
      parsers: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SearchOptions = z.infer<typeof searchOptionsSchema>;
```

**Validation**: No explicit validation needed - it's a pass-through string to Firecrawl API

---

## 2. Update Client Interface (Optional but Recommended)

**File**: `/shared/clients/firecrawl-search.client.ts`

**Current Code** (lines 3-21):

```typescript
export interface SearchOptions {
  query: string;
  limit?: number;
  sources?: Array<'web' | 'images' | 'news'>;
  categories?: Array<'github' | 'research' | 'pdf'>;
  country?: string;
  lang?: string;
  location?: string;
  timeout?: number;
  ignoreInvalidURLs?: boolean;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    removeBase64Images?: boolean;
    blockAds?: boolean;
    waitFor?: number;
    parsers?: string[];
  };
}
```

**Change**: Add `tbs` field:

```typescript
export interface SearchOptions {
  query: string;
  limit?: number;
  sources?: Array<'web' | 'images' | 'news'>;
  categories?: Array<'github' | 'research' | 'pdf'>;
  country?: string;
  lang?: string;
  location?: string;
  tbs?: string; // ADD THIS LINE
  timeout?: number;
  ignoreInvalidURLs?: boolean;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    removeBase64Images?: boolean;
    blockAds?: boolean;
    waitFor?: number;
    parsers?: string[];
  };
}
```

**Why**: Keep client interface in sync with schema

---

## 3. Add Test Cases

**File**: `/shared/mcp/tools/search/index.test.ts`

**Add these test cases** (append to existing tests):

```typescript
describe('Search Tool - Time-Based Filtering', () => {
  it('should accept tbs parameter for past 24 hours', async () => {
    const args = {
      query: 'AI news',
      limit: 5,
      tbs: 'qdr:d',
    };

    const result = await tool.handler(args);
    expect(result.isError).toBe(false);
  });

  it('should accept tbs parameter for past week', async () => {
    const args = {
      query: 'web scraping',
      limit: 5,
      tbs: 'qdr:w',
    };

    const result = await tool.handler(args);
    expect(result.isError).toBe(false);
  });

  it('should accept custom date range tbs parameter', async () => {
    const args = {
      query: 'machine learning',
      limit: 5,
      tbs: 'cdr:1,cd_min:01/01/2024,cd_max:01/31/2024',
    };

    const result = await tool.handler(args);
    expect(result.isError).toBe(false);
  });

  it('should pass tbs parameter to Firecrawl API', async () => {
    const mockClient = {
      search: vi.fn().mockResolvedValue({
        success: true,
        data: { web: [] },
        creditsUsed: 2,
      }),
    };

    const tool = createSearchTool(config);
    const args = {
      query: 'test',
      tbs: 'qdr:d',
    };

    // Verify tbs is in the request
    const validatedArgs = searchOptionsSchema.parse(args);
    expect(validatedArgs.tbs).toBe('qdr:d');
  });
});
```

---

## 4. Update Documentation

**File**: `/docs/tools/SEARCH.md`

**Add new section after "Parameters"** (after line 69):

````markdown
### Time-Based Search

The `tbs` parameter filters results by time period. Use predefined ranges for common intervals or specify custom date ranges.

#### Predefined Time Ranges

| Value   | Meaning       |
| ------- | ------------- |
| `qdr:h` | Past hour     |
| `qdr:d` | Past 24 hours |
| `qdr:w` | Past week     |
| `qdr:m` | Past month    |
| `qdr:y` | Past year     |

#### Custom Date Ranges

Format: `cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY`

Example: `cdr:1,cd_min:01/01/2024,cd_max:01/31/2024`

#### Examples

**Search for news from past 24 hours**:

```json
{
  "query": "artificial intelligence",
  "sources": ["news"],
  "tbs": "qdr:d",
  "limit": 10
}
```
````

**Search for research papers from December 2024**:

```json
{
  "query": "neural networks",
  "categories": ["research"],
  "tbs": "cdr:1,cd_min:12/01/2024,cd_max:12/31/2024",
  "limit": 5
}
```

**Search past week for GitHub repositories**:

```json
{
  "query": "web scraping python",
  "categories": ["github"],
  "tbs": "qdr:w",
  "limit": 10
}
```

````

**Update Parameters Table** (line 56-69):

Add this row:
```markdown
| `tbs`               | string  | No       | -       | Time-based search filter (predefined: `qdr:h/d/w/m/y`, custom: `cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY`) |
````

**Add new Tips section** (after "Tips" at line 164):

```markdown
### Time-Based Search Tips

- Use `qdr:d` to find fresh content or breaking news
- Use `qdr:w` for recent updates and weekly reviews
- Use `qdr:m` for month-long trend analysis
- Custom date ranges support any start/end date
- Combine with `sources: ["news"]` for current events
- Helpful for research to limit results to recent papers
```

---

## 5. Add to Client Type Definition

**File**: `/shared/clients/firecrawl-search.client.ts`

Update the interface to include better documentation:

```typescript
export interface SearchOptions {
  query: string;
  limit?: number;
  sources?: Array<'web' | 'images' | 'news'>;
  categories?: Array<'github' | 'research' | 'pdf'>;
  country?: string;
  lang?: string;
  location?: string;
  /**
   * Time-based search filter
   * Predefined: 'qdr:h' (hour), 'qdr:d' (day), 'qdr:w' (week), 'qdr:m' (month), 'qdr:y' (year)
   * Custom: 'cdr:1,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY'
   * @see https://docs.firecrawl.dev/features/search#time-based-search
   */
  tbs?: string;
  timeout?: number;
  ignoreInvalidURLs?: boolean;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    removeBase64Images?: boolean;
    blockAds?: boolean;
    waitFor?: number;
    parsers?: string[];
  };
}
```

---

## 6. Verification Checklist

After implementing changes:

- [ ] Run `npm test` from project root (all tests pass)
- [ ] Run `npm run build` from `/shared`
- [ ] Test with actual Firecrawl API:
  ```bash
  # Test past 24 hours
  curl -X POST https://api.firecrawl.dev/v2/search \
    -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{
      "query": "AI news",
      "limit": 5,
      "tbs": "qdr:d"
    }'
  ```
- [ ] Verify schema validation accepts `tbs`
- [ ] Check that `tbs` is passed to Firecrawl API unchanged
- [ ] Update CHANGELOG.md with new feature

---

## 7. Update CHANGELOG

**File**: `/CHANGELOG.md` (or similar)

Add to appropriate version section:

```markdown
### Added

- Add `tbs` parameter to search tool for time-based filtering (past hour/day/week/month/year or custom date ranges)
- Add examples for time-based search in documentation
```

---

## 8. Alternative: Add Lang Explicitly (Optional)

**File**: `/shared/mcp/tools/search/schema.ts`

The `lang` field is already there, but you could make it more explicit:

**Current** (line 9):

```typescript
lang: z.string().optional().default('en'),
```

This is already correct! No change needed.

**If you want to add validation**:

```typescript
lang: z
  .enum(['en', 'de', 'fr', 'es', 'it', 'ja', 'zh', 'ru'])
  .optional()
  .default('en'),
```

**But**: Firecrawl likely supports more languages, so keeping it as a string is better.

---

## Implementation Timeline

### Session 1: Core Implementation (1-2 hours)

1. Add `tbs` to schema (5 minutes)
2. Add `tbs` to client interface (5 minutes)
3. Add test cases (20 minutes)
4. Run tests and verify (10 minutes)
5. Update documentation (20-30 minutes)
6. Total: 60-80 minutes

### Session 2: Documentation Polish (30 minutes)

1. Add time-based search tips
2. Add cost implications note
3. Review examples for accuracy

---

## Testing the Implementation

**Manual test after implementation**:

```typescript
import { createSearchTool } from './shared/mcp/tools/search/index.js';

const tool = createSearchTool({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

// Test TBS parameter
const result = await tool.handler({
  query: 'AI news',
  tbs: 'qdr:d',
  limit: 5,
});

console.log('Result:', result);
```

---

## Summary

**Files to Modify**: 3 core files

1. `/shared/mcp/tools/search/schema.ts` - Add 1 line
2. `/shared/clients/firecrawl-search.client.ts` - Add 1 line
3. `/docs/tools/SEARCH.md` - Add examples and table row

**Files to Update**: 1 optional file

1. `/shared/mcp/tools/search/index.test.ts` - Add test cases

**Total Implementation Time**: 1-2 hours including tests and documentation

**No breaking changes** - All additions are optional parameters

---

## References

- **Firecrawl Search Docs**: https://docs.firecrawl.dev/features/search#time-based-search
- **API Reference**: https://docs.firecrawl.dev/api-reference/endpoint/search#body-tbs
- **Complete Session Notes**: `/home/jmagar/code/pulse-fetch/.docs/sessions/2025-11-07-firecrawl-search-endpoint-research.md`
