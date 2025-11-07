/**
 * @fileoverview Firecrawl scraping client implementation
 *
 * Provides enhanced content extraction using the Firecrawl API with
 * JavaScript rendering, anti-bot bypass, and intelligent content extraction.
 *
 * @module shared/scraping/clients/firecrawl/client
 */

/**
 * Interface for Firecrawl scraping client
 *
 * Defines the contract for scraping with Firecrawl's advanced features
 * including JavaScript rendering and content extraction.
 */
export interface IFirecrawlScrapingClient {
  scrape(url: string, options?: FirecrawlScrapingOptions): Promise<FirecrawlScrapingResult>;
}

/**
 * Configuration options for Firecrawl scraping operations
 *
 * Controls how Firecrawl extracts and processes webpage content including
 * output formats, content filtering, wait times, and extraction parameters.
 */
export interface FirecrawlScrapingOptions {
  formats?: Array<'markdown' | 'html'>;
  onlyMainContent?: boolean;
  waitFor?: number;
  timeout?: number;
  extract?: {
    schema?: Record<string, unknown>;
    systemPrompt?: string;
    prompt?: string;
  };
  removeBase64Images?: boolean;
  maxAge?: number;
  proxy?: 'basic' | 'stealth' | 'auto';
  blockAds?: boolean;
}

/**
 * Result of a Firecrawl scraping operation
 *
 * Contains the scraped content in multiple formats along with metadata
 * about the page. On error, includes error message details.
 */
export interface FirecrawlScrapingResult {
  success: boolean;
  data?: {
    content: string;
    markdown: string;
    html: string;
    metadata: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Firecrawl scraping client implementation
 *
 * Wraps the Firecrawl API to provide advanced web scraping with JavaScript
 * rendering, anti-bot bypass, and intelligent content extraction capabilities.
 * Requires a valid Firecrawl API key.
 *
 * @example
 * ```typescript
 * const client = new FirecrawlScrapingClient(process.env.FIRECRAWL_API_KEY);
 * const result = await client.scrape('https://example.com', {
 *   formats: ['markdown'],
 *   onlyMainContent: true
 * });
 * ```
 */
export class FirecrawlScrapingClient implements IFirecrawlScrapingClient {
  constructor(private apiKey: string) {}

  async scrape(
    url: string,
    options: FirecrawlScrapingOptions = {}
  ): Promise<FirecrawlScrapingResult> {
    const { scrapeWithFirecrawl } = await import('./api.js');
    return scrapeWithFirecrawl(this.apiKey, url, options as Record<string, unknown>);
  }
}
