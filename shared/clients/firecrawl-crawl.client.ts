import type { FirecrawlConfig } from '../types.js';
import type { BrowserAction } from '../mcp/tools/scrape/action-types.js';

export interface CrawlOptions {
  url: string;
  prompt?: string;
  limit?: number;
  maxDepth?: number;
  crawlEntireDomain?: boolean;
  allowSubdomains?: boolean;
  allowExternalLinks?: boolean;
  includePaths?: string[];
  excludePaths?: string[];
  ignoreQueryParameters?: boolean;
  sitemap?: 'include' | 'skip';
  delay?: number;
  maxConcurrency?: number;
  scrapeOptions?: {
    formats?: string[];
    onlyMainContent?: boolean;
    includeTags?: string[];
    excludeTags?: string[];
    actions?: BrowserAction[];
  };
}

export interface StartCrawlResult {
  success: boolean;
  id: string;
  url: string;
}

export interface CrawlStatusResult {
  status: 'scraping' | 'completed' | 'failed' | 'cancelled';
  total: number;
  completed: number;
  creditsUsed: number;
  expiresAt: string;
  next?: string;
  data: Array<{
    markdown?: string;
    html?: string;
    rawHtml?: string;
    links?: string[];
    screenshot?: string;
    metadata?: {
      title?: string;
      description?: string;
      language?: string;
      sourceURL?: string;
      statusCode?: number;
      [key: string]: any;
    };
  }>;
}

export interface CancelResult {
  status: 'cancelled';
}

export class FirecrawlCrawlClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: FirecrawlConfig) {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    const base = config.baseUrl || 'https://api.firecrawl.dev';
    this.baseUrl = `${base}/v2`;
  }

  async startCrawl(options: CrawlOptions): Promise<StartCrawlResult> {
    const response = await fetch(`${this.baseUrl}/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async getStatus(jobId: string): Promise<CrawlStatusResult> {
    const response = await fetch(`${this.baseUrl}/crawl/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  async cancel(jobId: string): Promise<CancelResult> {
    const response = await fetch(`${this.baseUrl}/crawl/${jobId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }
}
