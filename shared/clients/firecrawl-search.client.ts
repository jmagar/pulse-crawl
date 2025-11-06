import type { FirecrawlConfig } from '../types.js';

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

export interface SearchResult {
  success: boolean;
  data:
    | Array<{
        url: string;
        title?: string;
        description?: string;
        markdown?: string;
        html?: string;
        position?: number;
        category?: string;
      }>
    | {
        web?: Array<any>;
        images?: Array<any>;
        news?: Array<any>;
      };
  creditsUsed: number;
}

export class FirecrawlSearchClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: FirecrawlConfig) {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v2';
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const response = await fetch(`${this.baseUrl}/search`, {
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
}
