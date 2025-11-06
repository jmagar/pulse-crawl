import type { FirecrawlConfig } from '../types.js';

export interface MapOptions {
  url: string;
  search?: string;
  limit?: number;
  sitemap?: 'skip' | 'include' | 'only';
  includeSubdomains?: boolean;
  ignoreQueryParameters?: boolean;
  timeout?: number;
  location?: {
    country?: string;
    languages?: string[];
  };
}

export interface MapResult {
  success: boolean;
  links: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
}

export class FirecrawlMapClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(config: FirecrawlConfig) {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev/v2';
  }

  async map(options: MapOptions): Promise<MapResult> {
    const response = await fetch(`${this.baseUrl}/map`, {
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
