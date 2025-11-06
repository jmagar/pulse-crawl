# Strategy Selection Guide

This document explains how Pulse Fetch decides which scraping strategy (native vs Firecrawl) to use for each request.

## Overview

Pulse Fetch uses a **two-tier fallback system** with intelligent strategy selection based on:

1. **Optimization mode** - Configured via `OPTIMIZE_FOR` environment variable
2. **URL-specific strategies** - Configured via strategy configuration file
3. **Automatic learning** - Remembers successful strategies for future requests

## Quick Start

### For Self-Hosted Firecrawl Users

If you're self-hosting Firecrawl (cost is not a factor), use **speed mode** for best results:

```bash
OPTIMIZE_FOR=speed
FIRECRAWL_API_KEY=your-self-hosted-key
FIRECRAWL_API_BASE_URL=https://your-firecrawl-instance.com
```

This will:

- Use Firecrawl for all requests (no native fallback)
- Get JavaScript rendering and enhanced content extraction
- Provide optimal content quality for documentation ingestion

---

## Optimization Modes

### Cost Mode (Default)

**When to use:** Minimizing API costs (cloud-hosted Firecrawl)

**Behavior:**

```
Request → Native (free) → Firecrawl (if native fails)
```

**Configuration:**

```bash
OPTIMIZE_FOR=cost  # or omit (default)
```

**Strategy Flow:**

1. **First attempt:** Native HTTP fetch
   - Fast and free
   - Works for most public documentation sites
   - No JavaScript rendering

2. **Fallback:** Firecrawl (if native fails or returns errors)
   - JavaScript rendering
   - Enhanced content extraction
   - Better handling of dynamic content

**Best for:**

- Public documentation sites that don't require JavaScript
- Cost-sensitive deployments
- High-volume scraping where most sites work with native

---

### Speed Mode (Recommended for Self-Hosted)

**When to use:** Maximum content quality, self-hosted Firecrawl

**Behavior:**

```
Request → Firecrawl (only) → No fallback to native
```

**Configuration:**

```bash
OPTIMIZE_FOR=speed
```

**Strategy Flow:**

1. **Only attempt:** Firecrawl
   - JavaScript rendering enabled
   - Enhanced content extraction
   - Better handling of SPAs and dynamic sites
   - No wasted time trying native first

**Best for:**

- Self-hosted Firecrawl (cost is not a factor)
- Documentation sites with JavaScript-heavy content
- When you need consistent, high-quality extraction
- SPAs (Single Page Applications)

---

## Strategy Configuration System

Beyond optimization modes, you can configure **URL-specific strategies** that override the default behavior.

### How It Works

The strategy selection follows this priority order:

```
1. Check URL-specific configuration (highest priority)
   ↓
2. Try configured strategy for that URL pattern
   ↓
3. Fall back to optimization mode if configured strategy fails
   ↓
4. Remember successful strategy for future requests (auto-learning)
```

### Configuration File

Strategy configurations are stored in a Markdown table format:

**Location:** Configurable via `PULSE_FETCH_STRATEGY_CONFIG_PATH` or defaults to OS temp directory

**Format:**

```markdown
# Scraping Strategy Configuration

This file defines which scraping strategy to use for different URL prefixes (native, firecrawl).

| prefix           | default_strategy | notes              |
| ---------------- | ---------------- | ------------------ |
| docs.python.org/ | firecrawl        | Needs JS rendering |
| github.com/api/  | native           | Simple JSON API    |
```

### Adding Entries

**Manually:**
Edit the configuration file and add rows to the table:

```markdown
| your-site.com/docs/ | firecrawl | Your note here |
```

**Automatically:**
Pulse Fetch learns successful strategies and adds them automatically:

```typescript
// When a scrape succeeds, the strategy is saved
// Future requests to the same URL pattern use that strategy
```

### URL Pattern Matching

Patterns are matched by **prefix**, removing the last path segment:

**Examples:**

- `https://docs.python.org/3/library/os.html` → `docs.python.org/3/library/`
- `https://github.com/user/repo/blob/main/file.ts` → `github.com/user/repo/blob/main/`

**This means:**

- All pages under `docs.python.org/3/library/` will use the same strategy
- Each major section can have its own strategy

---

## Decision Flow Diagram

### Cost Mode Flow

```
User makes scrape request
        ↓
Check strategy config for URL pattern
        ↓
   Found?  → Yes → Try configured strategy
     ↓ No            ↓ Success → Return result
     ↓               ↓ Fail
     ↓               ↓
     └───────────────┘
             ↓
    Try Native scraping
             ↓
       Success? → Yes → Save strategy & return
         ↓ No
         ↓
    Try Firecrawl
         ↓
   Success? → Yes → Save strategy & return
     ↓ No
     ↓
   Return error with diagnostics
```

### Speed Mode Flow

```
User makes scrape request
        ↓
Check strategy config for URL pattern
        ↓
   Found?  → Yes → Try configured strategy
     ↓ No            ↓ Success → Return result
     ↓               ↓ Fail
     ↓               ↓
     └───────────────┘
             ↓
    Try Firecrawl (skip native)
             ↓
       Success? → Yes → Save strategy & return
         ↓ No
         ↓
   Return error with diagnostics
```

---

## Examples

### Example 1: Self-Hosted Firecrawl (Your Use Case)

**Goal:** Always use Firecrawl for best quality

**Configuration:**

```bash
OPTIMIZE_FOR=speed
FIRECRAWL_API_KEY=your-key
FIRECRAWL_API_BASE_URL=https://firecrawl.yourcompany.com
```

**Behavior:**

- Every request goes directly to Firecrawl
- No time wasted on native attempts
- Consistent high-quality extraction
- JavaScript rendering always enabled

---

### Example 2: Cloud Firecrawl with Cost Optimization

**Goal:** Minimize API costs, use Firecrawl only when needed

**Configuration:**

```bash
OPTIMIZE_FOR=cost  # default
FIRECRAWL_API_KEY=fc-xxx
```

**Behavior:**

- Tries native first (free)
- Falls back to Firecrawl if native fails
- Learns which sites need Firecrawl
- Future requests to learned sites go straight to Firecrawl

---

### Example 3: Mixed Strategy (Per-Domain)

**Goal:** Use different strategies for different sites

**Strategy Config:**

```markdown
| prefix                  | default_strategy | notes        |
| ----------------------- | ---------------- | ------------ |
| docs.python.org/        | firecrawl        | Needs JS     |
| api.github.com/         | native           | Simple API   |
| docs.djangoproject.com/ | firecrawl        | Complex docs |
```

**Environment:**

```bash
OPTIMIZE_FOR=cost  # fallback behavior
FIRECRAWL_API_KEY=your-key
```

**Behavior:**

- `docs.python.org/*` → Always uses Firecrawl
- `api.github.com/*` → Always uses Native
- Other sites → Use cost mode (native → firecrawl)

---

## Diagnostics

Every scrape response includes diagnostics showing exactly what happened:

```json
{
  "success": true,
  "content": "...",
  "source": "firecrawl",
  "diagnostics": {
    "strategiesAttempted": ["native", "firecrawl"],
    "strategyErrors": {
      "native": "HTTP 403"
    },
    "timing": {
      "native": 245,
      "firecrawl": 1823
    }
  }
}
```

**Fields explained:**

- `strategiesAttempted`: Which strategies were tried, in order
- `strategyErrors`: Why each failed strategy failed
- `timing`: How long each strategy took (milliseconds)
- `source`: Which strategy ultimately succeeded

---

## Best Practices

### For Documentation Ingestion (Your Use Case)

**Recommendation:** Speed mode with self-hosted Firecrawl

```bash
OPTIMIZE_FOR=speed
FIRECRAWL_API_KEY=your-key
FIRECRAWL_API_BASE_URL=https://your-instance.com
```

**Why:**

- Documentation sites often use JavaScript frameworks
- Firecrawl's content extraction is superior for docs
- Self-hosting means cost isn't a factor
- Consistent results across all sites

### For High-Volume Public Scraping

**Recommendation:** Cost mode with strategy learning

```bash
OPTIMIZE_FOR=cost
FIRECRAWL_API_KEY=your-key
```

**Why:**

- Most sites work fine with native
- Automatic learning optimizes over time
- Minimizes API costs
- Firecrawl used only when necessary

### For Known Problematic Sites

**Recommendation:** Use strategy configuration

```markdown
| problematic-site.com/ | firecrawl | Always fails with native |
```

**Why:**

- Skip the failed native attempt
- Go straight to what works
- Faster response times
- Better user experience

---

## Troubleshooting

### Native always fails for a site

**Solution:** Add to strategy config:

```markdown
| that-site.com/ | firecrawl | Native returns 403 |
```

### Want to force native for API endpoints

**Solution:** Add to strategy config:

```markdown
| api.site.com/ | native | Simple JSON API |
```

### Not sure which strategy works best

**Solution:** Let auto-learning figure it out:

1. Start with default (cost mode)
2. Make requests to the site
3. Check diagnostics to see what works
4. Strategy is automatically saved for future requests

### Want to see what's happening

**Solution:** Check response diagnostics:

```javascript
const result = await scrape(url);
console.log(result.diagnostics);
// Shows: attempts, errors, timing
```

---

## Environment Variables Reference

```bash
# Optimization mode
OPTIMIZE_FOR=speed          # firecrawl only
OPTIMIZE_FOR=cost           # native → firecrawl (default)

# Firecrawl configuration
FIRECRAWL_API_KEY=your-key
FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev  # optional

# Strategy config file
PULSE_FETCH_STRATEGY_CONFIG_PATH=/path/to/config.md  # optional
```

---

## Summary

**Key Takeaways:**

1. **Speed mode** = Firecrawl only (best for self-hosted)
2. **Cost mode** = Native first, Firecrawl fallback (best for cloud)
3. **Strategy config** = Per-URL overrides (highest priority)
4. **Auto-learning** = System remembers what works
5. **Diagnostics** = See exactly what happened

**For your use case (self-hosted Firecrawl):**

```bash
OPTIMIZE_FOR=speed
```

This gives you maximum quality without wasting time on native attempts that will likely fail or produce inferior results for documentation sites.
