import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  describe('search', () => {
    it('should perform basic search and return results', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            url: 'https://example.com/page1',
            title: 'Example Page 1',
            description: 'Test description',
          },
        ],
        creditsUsed: 2,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new FirecrawlSearchClient(config);
      const result = await client.search({ query: 'test query', limit: 5 });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v2/search',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer fc-test-api-key',
          }),
          body: JSON.stringify({ query: 'test query', limit: 5 }),
        })
      );
    });

    it('should handle API errors', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Invalid API key',
      });

      const client = new FirecrawlSearchClient(config);
      await expect(client.search({ query: 'test' })).rejects.toThrow(
        'Firecrawl API error (401): Invalid API key'
      );
    });
  });
});
