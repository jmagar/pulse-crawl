import { describe, it, expect, beforeEach } from 'vitest';
import { FirecrawlSearchClient } from './firecrawl-search.client.js';
import type { FirecrawlConfig } from '../types.js';

describe('FirecrawlSearchClient', () => {
  let config: FirecrawlConfig;

  beforeEach(() => {
    config = {
      apiKey: 'fc-test-api-key',
      baseUrl: 'https://api.firecrawl.dev/v2',
    };
  });

  describe('initialization', () => {
    it('should create instance with valid config', () => {
      const client = new FirecrawlSearchClient(config);
      expect(client).toBeInstanceOf(FirecrawlSearchClient);
    });

    it('should throw error if API key is missing', () => {
      const invalidConfig = { ...config, apiKey: '' };
      expect(() => new FirecrawlSearchClient(invalidConfig)).toThrow('API key is required');
    });
  });
});
