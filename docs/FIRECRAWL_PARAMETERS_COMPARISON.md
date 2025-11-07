# Firecrawl CRAWL Endpoint - Complete Parameter Reference

**Quick Reference**: All parameters available in Firecrawl v2 `/crawl` endpoint vs. what pulse-fetch exposes.

---

## Summary Statistics

| Metric                         | Count         |
| ------------------------------ | ------------- |
| **Total Firecrawl Parameters** | 35+           |
| **Currently Exposed**          | 11            |
| **Coverage**                   | ~31%          |
| **Priority Gaps**              | 4 (Phase 1)   |
| **Important Additions**        | 8 (Phase 2)   |
| **Advanced Features**          | 12+ (Phase 3) |

---

## Complete Parameter Matrix

### CORE PARAMETERS

| #   | Parameter | Type   | Default    | Firecrawl Docs | Pulse-Fetch | Priority | Notes                              |
| --- | --------- | ------ | ---------- | -------------- | ----------- | -------- | ---------------------------------- |
| 1   | `url`     | string | ✓ Required | ✅             | ✅          | Core     | Base URL to crawl from             |
| 2   | `prompt`  | string | Optional   | ✅ v2 NEW      | ❌          | P1       | Natural language crawl description |

---

### SCOPE & DEPTH PARAMETERS

| #   | Parameter            | Type    | Default | Firecrawl | Pulse-Fetch           | Priority | Notes                                     |
| --- | -------------------- | ------- | ------- | --------- | --------------------- | -------- | ----------------------------------------- |
| 3   | `limit`              | integer | 10,000  | ✅        | ✅ (default: 100)     | Core     | Max pages to crawl                        |
| 4   | `maxDiscoveryDepth`  | integer | -       | ✅        | ⚠️ (named `maxDepth`) | Core     | Max depth for link discovery              |
| 5   | `crawlEntireDomain`  | boolean | false   | ✅        | ✅                    | Core     | Allow siblings/parents, not just children |
| 6   | `allowSubdomains`    | boolean | false   | ✅        | ✅                    | Core     | Follow subdomain links                    |
| 7   | `allowExternalLinks` | boolean | false   | ✅        | ✅                    | Core     | Follow external website links             |

---

### URL FILTERING PARAMETERS

| #   | Parameter               | Type     | Default | Firecrawl | Pulse-Fetch | Priority | Notes                                  |
| --- | ----------------------- | -------- | ------- | --------- | ----------- | -------- | -------------------------------------- |
| 8   | `includePaths`          | string[] | -       | ✅        | ✅          | Core     | Regex patterns for URLs to INCLUDE     |
| 9   | `excludePaths`          | string[] | -       | ✅        | ✅          | Core     | Regex patterns for URLs to EXCLUDE     |
| 10  | `ignoreQueryParameters` | boolean  | true    | ✅        | ✅          | Core     | Don't re-scrape query param variations |

---

### SITEMAP PARAMETERS

| #   | Parameter | Type | Default   | Firecrawl | Pulse-Fetch | Priority | Notes                        |
| --- | --------- | ---- | --------- | --------- | ----------- | -------- | ---------------------------- |
| 11  | `sitemap` | enum | "include" | ✅        | ✅          | Core     | Options: "include" or "skip" |

---

### PERFORMANCE PARAMETERS

| #   | Parameter        | Type    | Default | Firecrawl | Pulse-Fetch | Priority | Notes                           |
| --- | ---------------- | ------- | ------- | --------- | ----------- | -------- | ------------------------------- |
| 12  | `delay`          | number  | -       | ✅        | ✅          | Core     | Delay (seconds) between scrapes |
| 13  | `maxConcurrency` | integer | -       | ✅        | ✅          | Core     | Max concurrent requests         |

---

### SCRAPE OPTIONS: FORMAT PARAMETERS

| #   | Parameter             | Type     | Default      | Firecrawl      | Pulse-Fetch    | Priority | Notes                         |
| --- | --------------------- | -------- | ------------ | -------------- | -------------- | -------- | ----------------------------- |
| 14  | `formats`             | string[] | ["markdown"] | ✅ (9 options) | ⚠️ (4 options) | Core     | Output formats                |
| 14a | └─ `"markdown"`       | format   | -            | ✅             | ✅             | Core     | Cleaned markdown (default)    |
| 14b | └─ `"html"`           | format   | -            | ✅             | ✅             | Core     | Full page HTML                |
| 14c | └─ `"rawHtml"`        | format   | -            | ✅             | ✅             | Core     | Complete page source          |
| 14d | └─ `"links"`          | format   | -            | ✅             | ✅             | Core     | All URLs found on page        |
| 14e | └─ `"screenshot"`     | format   | -            | ✅             | ✅             | Core     | Browser screenshot PNG        |
| 14f | └─ `"summary"`        | format   | -            | ✅             | ❌             | P3       | AI page summary               |
| 14g | └─ `"images"`         | format   | -            | ✅             | ❌             | P3       | Image URLs & metadata         |
| 14h | └─ `"json"`           | format   | -            | ✅             | ❌             | P3       | Structured data (with schema) |
| 14i | └─ `"changeTracking"` | format   | -            | ✅             | ❌             | P3       | Monitor changes over time     |

---

### SCRAPE OPTIONS: CONTENT FILTERING

| #   | Parameter         | Type     | Default | Firecrawl | Pulse-Fetch | Priority | Notes                            |
| --- | ----------------- | -------- | ------- | --------- | ----------- | -------- | -------------------------------- |
| 15  | `onlyMainContent` | boolean  | true    | ✅        | ✅          | Core     | Remove headers, navs, footers    |
| 16  | `includeTags`     | string[] | -       | ✅        | ✅          | Core     | HTML tags/classes/IDs to INCLUDE |
| 17  | `excludeTags`     | string[] | -       | ✅        | ✅          | Core     | HTML tags/classes/IDs to EXCLUDE |

---

### SCRAPE OPTIONS: BROWSER LOADING

| #   | Parameter | Type         | Default | Firecrawl | Pulse-Fetch | Priority | Notes                              |
| --- | --------- | ------------ | ------- | --------- | ----------- | -------- | ---------------------------------- |
| 18  | `waitFor` | integer (ms) | 0       | ✅        | ❌          | P1 ⭐    | Delay before scraping (JS loading) |
| 19  | `timeout` | integer (ms) | -       | ✅        | ❌          | P1 ⭐    | Request timeout milliseconds       |
| 20  | `mobile`  | boolean      | false   | ✅        | ❌          | P3       | Emulate mobile device              |

---

### SCRAPE OPTIONS: REQUEST & SECURITY

| #   | Parameter             | Type    | Default | Firecrawl | Pulse-Fetch | Priority | Notes                                  |
| --- | --------------------- | ------- | ------- | --------- | ----------- | -------- | -------------------------------------- |
| 21  | `headers`             | object  | -       | ✅        | ❌          | P2       | Custom HTTP headers (auth, UA, etc.)   |
| 22  | `skipTlsVerification` | boolean | true    | ✅        | ❌          | P3       | Skip TLS certificate verification      |
| 23  | `proxy`               | enum    | "auto"  | ✅        | ❌          | P2       | Proxy type: "auto", "basic", "stealth" |

---

### SCRAPE OPTIONS: CONTENT PROCESSING

| #   | Parameter            | Type     | Default | Firecrawl | Pulse-Fetch | Priority | Notes                                    |
| --- | -------------------- | -------- | ------- | --------- | ----------- | -------- | ---------------------------------------- |
| 24  | `blockAds`           | boolean  | true    | ✅        | ❌          | P2       | Block ads and cookie popups              |
| 25  | `removeBase64Images` | boolean  | true    | ✅        | ❌          | P2       | Remove inline base64 images              |
| 26  | `storeInCache`       | boolean  | true    | ✅        | ❌          | P3       | Store in Firecrawl cache                 |
| 27  | `parsers`            | string[] | ["pdf"] | ✅        | ❌          | P2       | File parsers: "pdf" extracts to markdown |

---

### SCRAPE OPTIONS: CACHE & AGE

| #   | Parameter | Type         | Default     | Firecrawl | Pulse-Fetch | Priority | Notes                                |
| --- | --------- | ------------ | ----------- | --------- | ----------- | -------- | ------------------------------------ |
| 28  | `maxAge`  | integer (ms) | 172,800,000 | ✅        | ❌          | P3       | Max cache age before re-scrape (48h) |

---

### SCRAPE OPTIONS: LOCATION & LOCALIZATION

| #   | Parameter            | Type     | Default | Firecrawl | Pulse-Fetch | Priority | Notes                                      |
| --- | -------------------- | -------- | ------- | --------- | ----------- | -------- | ------------------------------------------ |
| 29  | `location.country`   | string   | "US"    | ✅        | ❌          | P3       | ISO 3166-1 country code (e.g., "GB", "DE") |
| 30  | `location.languages` | string[] | -       | ✅        | ❌          | P3       | Languages (e.g., ["en-US", "fr-FR"])       |

---

### SCRAPE OPTIONS: PAGE ACTIONS

| #   | Parameter              | Type   | Default | Firecrawl | Pulse-Fetch | Priority | Notes                         |
| --- | ---------------------- | ------ | ------- | --------- | ----------- | -------- | ----------------------------- |
| 31  | `actions`              | array  | -       | ✅        | ❌          | P1 ⭐    | Pre-scrape page interactions  |
| 31a | └─ `wait`              | action | -       | ✅        | ❌          | P1       | Wait N milliseconds           |
| 31b | └─ `click`             | action | -       | ✅        | ❌          | P1       | Click element by CSS selector |
| 31c | └─ `scroll`            | action | -       | ✅        | ❌          | P1       | Scroll (direction, amount)    |
| 31d | └─ `write`             | action | -       | ✅        | ❌          | P1       | Type text into focused input  |
| 31e | └─ `press`             | action | -       | ✅        | ❌          | P1       | Press keyboard key            |
| 31f | └─ `screenshot`        | action | -       | ✅        | ❌          | P1       | Take page screenshot          |
| 31g | └─ `executeJavascript` | action | -       | ✅        | ❌          | P1       | Execute arbitrary JS code     |
| 31h | └─ `pdf`               | action | -       | ✅        | ❌          | P1       | Generate PDF of page          |

---

### WEBHOOK PARAMETERS

| #   | Parameter          | Type     | Default | Firecrawl | Pulse-Fetch | Priority | Notes                                                  |
| --- | ------------------ | -------- | ------- | --------- | ----------- | -------- | ------------------------------------------------------ |
| 32  | `webhook.url`      | string   | -       | ✅        | ❌          | P3       | Webhook endpoint URL                                   |
| 33  | `webhook.headers`  | object   | -       | ✅        | ❌          | P3       | Custom webhook request headers                         |
| 34  | `webhook.metadata` | object   | -       | ✅        | ❌          | P3       | Custom metadata in payloads                            |
| 35  | `webhook.events`   | string[] | (all)   | ✅        | ❌          | P3       | Event filter: "started", "page", "completed", "failed" |

---

### RESPONSE & DATA RETENTION

| #   | Parameter           | Type    | Default | Firecrawl | Pulse-Fetch | Priority | Notes                                         |
| --- | ------------------- | ------- | ------- | --------- | ----------- | -------- | --------------------------------------------- |
| 36  | `zeroDataRetention` | boolean | false   | ✅        | ❌          | P3       | Don't store on Firecrawl servers (enterprise) |

---

### RESPONSE PAGINATION

| #   | Field  | Type   | Firecrawl | Pulse-Fetch  | Priority | Notes                                   |
| --- | ------ | ------ | --------- | ------------ | -------- | --------------------------------------- |
| 37  | `next` | string | ✅        | ❌           | P1 ⭐    | URL for next page of results            |
| 38  | `data` | array  | ✅        | ✅ (partial) | Core     | Page results (paginated, ~500 per page) |

---

## Quick Reference by Priority

### Phase 1: Critical (P1) - Do First ⭐⭐⭐

```
[ ] #2  - prompt (natural language)
[ ] #18 - waitFor (browser loading)
[ ] #19 - timeout (browser loading)
[ ] #31 - actions (page interactions)
[ ] #37 - next field (pagination)
```

**Why**: These 5 parameters unlock 80% of use cases and are high-impact for UX and reliability.

### Phase 2: Important (P2) - Do Second ⭐⭐

```
[ ] #21 - headers (custom requests, auth)
[ ] #23 - proxy (anti-bot bypass)
[ ] #24 - blockAds (content quality)
[ ] #25 - removeBase64Images (size reduction)
[ ] #27 - parsers (PDF extraction)
```

**Why**: These improve content quality and enable more use cases.

### Phase 3: Advanced (P3) - Do Last ⭐

```
[ ] #14f-i - format options (summary, images, json, changeTracking)
[ ] #20    - mobile (responsive testing)
[ ] #22    - skipTlsVerification (testing)
[ ] #26    - storeInCache (sensitive data)
[ ] #28    - maxAge (cache control)
[ ] #29-30 - location parameters (localization)
[ ] #32-35 - webhook parameters (notifications)
[ ] #36    - zeroDataRetention (compliance)
```

**Why**: Specialized features for advanced users.

---

## Parameter Type Definitions

### Simple Types

- `string` - Text value
- `integer` - Whole number
- `number` - Decimal number
- `boolean` - true/false

### Complex Types

- `string[]` - Array of strings (e.g., `["tag1", "tag2"]`)
- `enum` - Limited set of values (e.g., `"include" | "skip"`)
- `object` - Nested object with properties (e.g., `{ url, headers, metadata, events }`)
- `array` - Complex items like actions

---

## Best Practices by Parameter

### Natural Language (prompt)

- Describe in English what you want to crawl
- Firecrawl generates optimal parameters
- Examples:
  - `"Extract API documentation"`
  - `"Crawl product pages but skip marketing"`
  - `"Get all blog posts from 2024"`

### Page Actions (actions)

- Chain multiple actions before scraping
- Always use `wait` between slow operations
- Order matters: click → wait → write → press → scrape
- Example: Load 10 more pages via "Load More" button

### Browser Loading (waitFor, timeout)

- Use `waitFor` for JS-heavy sites (2-5 seconds)
- Use `timeout` to prevent hanging (10-30 seconds)
- Together they solve most modern web issues

### Pagination (next)

- Check if `.next` exists in response
- Fetch additional pages until `.next` is absent
- Essential for large-scale crawls (1000+ pages)

### Custom Headers (headers)

- Add auth tokens, cookies, custom User-Agent
- Enables authenticated content scraping
- Useful for APIs behind HTTP Basic Auth

### Proxy Types (proxy)

- `"auto"`: Best for most sites
- `"stealth"`: For aggressive anti-bot sites
- `"basic"`: Simple proxy for IP rotation

---

## Summary: What to Implement When

**Short-term (1-2 weeks)**:

- P1 parameters: prompt, waitFor, timeout, actions, pagination
- Biggest impact on usability and reliability

**Medium-term (3-4 weeks)**:

- P2 parameters: headers, proxy, blockAds, removeBase64Images, parsers
- Improve content quality and auth scenarios

**Long-term (5+ weeks)**:

- P3 parameters: advanced formats, location, webhooks, enterprise features
- Specialized use cases and compliance

---

## Document References

- **Full Research**: `/home/jmagar/code/pulse-fetch/docs/plans/2025-11-07-firecrawl-crawl-api-comprehensive-research.md`
- **Summary**: `/home/jmagar/code/pulse-fetch/docs/FIRECRAWL_CRAWL_RESEARCH_SUMMARY.md`
- **Official Docs**: https://docs.firecrawl.dev/api-reference/endpoint/crawl-post
- **Blog Guide**: https://www.firecrawl.dev/blog/mastering-the-crawl-endpoint-in-firecrawl
- **GitHub**: https://github.com/firecrawl/firecrawl
