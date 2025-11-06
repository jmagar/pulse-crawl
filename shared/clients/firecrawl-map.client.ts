/**
 * @fileoverview Firecrawl Map API client
 *
 * Provides access to Firecrawl's Map API for URL discovery within websites.
 * Supports sitemap parsing, subdomain discovery, and search filtering.
 *
 * @module shared/clients/firecrawl-map
 */

import type { FirecrawlConfig } from '../types.js';

/**
 * Options for Firecrawl map operation
 *
 * Controls URL discovery behavior including search filters, limits,
 * sitemap handling, and location preferences.
 */
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

/**
 * Result of Firecrawl map operation
 *
 * Contains discovered URLs with optional title and description metadata.
 */
export interface MapResult {
  success: boolean;
  links: Array<{
    url: string;
    title?: string;
    description?: string;
  }>;
}

/**
 * Client for Firecrawl Map API
 *
 * Discovers URLs within a website using Firecrawl's Map endpoint.
 * Supports sitemap parsing, subdomain discovery, and advanced filtering.
 *
 * @example
 * ```typescript
 * const client = new FirecrawlMapClient({ apiKey: process.env.FIRECRAWL_API_KEY });
 * const result = await client.map({
 *   url: 'https://example.com',
 *   limit: 100,
 *   includeSubdomains: true
 * });
 * console.log(result.links);
 * ```
 */
export class FirecrawlMapClient {
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
