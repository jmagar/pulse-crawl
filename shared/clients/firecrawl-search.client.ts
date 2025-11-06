import type { FirecrawlConfig } from '../types.js';

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
}
