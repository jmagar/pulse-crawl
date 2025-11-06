# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Search tool**: Web search with multi-source support (web, images, news)
  - Filter by category: GitHub repositories, research papers, PDFs
  - Optional content scraping for search results
  - Geographic targeting with country and language preferences
- **Map tool**: Fast URL discovery (8x faster than crawling)
  - Sitemap integration with skip/include/only options
  - Search filtering to find specific URLs
  - Support for up to 100,000 URLs per request
  - Subdomain and query parameter handling
- **Crawl tool**: Consolidated recursive website crawling with job management
  - Start crawl with `url` parameter (returns job ID)
  - Check status with `jobId` parameter (monitor progress)
  - Cancel with `jobId` + `cancel: true` (stop in-progress jobs)
  - Path filtering with `includePaths` and `excludePaths`
  - Depth control, domain scope, and rate limiting options
- New client classes: `FirecrawlSearchClient`, `FirecrawlMapClient`, `FirecrawlCrawlClient`
- Comprehensive test coverage for all new tools (78 tests passing)
- Manual testing scripts for each tool in `tests/manual/features/`
- Complete documentation in `docs/tools/` (SEARCH.md, MAP.md, CRAWL.md)

### Changed

- Extended tool registration to support 4 total tools (scrape, search, map, crawl)
- Updated shared module exports to include new clients
- Consolidated crawl operations into single tool to reduce token usage

### BREAKING CHANGES

#### Removed BrightData Integration

**Removed all BrightData scraping functionality** in favor of a simplified two-tier fallback system (native → firecrawl).

**What Changed:**

- Removed BrightData client implementation
- Simplified scraping strategy from three-tier to two-tier
- Updated optimization modes:
  - `OPTIMIZE_FOR=cost`: Now uses native → firecrawl (previously native → firecrawl → brightdata)
  - `OPTIMIZE_FOR=speed`: Now uses firecrawl only (previously firecrawl → brightdata)
- Removed `BRIGHTDATA_API_KEY` environment variable
- Updated `ScrapingStrategy` type from `'native' | 'firecrawl' | 'brightdata'` to `'native' | 'firecrawl'`

**Migration Guide:**

1. Remove `BRIGHTDATA_API_KEY` from your environment configuration
2. Update any strategy configuration files that reference 'brightdata' to use 'firecrawl' or 'native'
3. Sites requiring anti-bot bypass should now use Firecrawl instead of BrightData
4. Test your scraping workflows to ensure they work with the two-tier fallback

**Why This Change:**
This change simplifies the scraping architecture, reduces maintenance complexity, and focuses on the two most effective strategies for documentation ingestion and RAG use cases.

---

## [0.3.0] - Previous Release

(Previous changelog entries would go here)
