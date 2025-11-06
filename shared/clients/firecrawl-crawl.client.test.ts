import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirecrawlCrawlClient } from './firecrawl-crawl.client.js';
import type { FirecrawlConfig } from '../types.js';

describe('FirecrawlCrawlClient', () => {
  let config: FirecrawlConfig;

  beforeEach(() => {
    config = {
      apiKey: 'fc-test-api-key',
      baseUrl: 'https://api.firecrawl.dev/v2',
    };
  });

  describe('initialization', () => {
    it('should create instance with valid config', () => {
      const client = new FirecrawlCrawlClient(config);
      expect(client).toBeInstanceOf(FirecrawlCrawlClient);
    });
  });

  describe('startCrawl', () => {
    it('should start crawl and return job ID', async () => {
      const mockResponse = {
        success: true,
        id: 'crawl-job-123',
        url: 'https://api.firecrawl.dev/v2/crawl/crawl-job-123',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new FirecrawlCrawlClient(config);
      const result = await client.startCrawl({
        url: 'https://example.com',
        limit: 100,
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v2/crawl',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fc-test-api-key',
          }),
          body: expect.stringContaining('https://example.com'),
        })
      );
    });
  });
});
