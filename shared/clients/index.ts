// Re-export unified Firecrawl client
export {
  FirecrawlClient,
  FirecrawlSearchClient,
  FirecrawlMapClient,
  FirecrawlCrawlClient,
  FirecrawlScrapingClient,
  categorizeFirecrawlError,
} from './firecrawl/index.js';

export type {
  FirecrawlConfig,
  FirecrawlScrapingOptions,
  FirecrawlScrapingResult,
  SearchOptions,
  SearchResult,
  MapOptions,
  MapResult,
  CrawlOptions,
  StartCrawlResult,
  CrawlStatusResult,
  CancelResult,
  FirecrawlError,
} from './firecrawl/index.js';
