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

  describe('getStatus', () => {
    it('should get crawl status and return results', async () => {
      const mockResponse = {
        status: 'scraping',
        total: 100,
        completed: 50,
        creditsUsed: 50,
        expiresAt: '2025-11-06T12:00:00Z',
        data: [
          {
            markdown: '# Page content',
            metadata: { title: 'Test Page', sourceURL: 'https://example.com/page1' },
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new FirecrawlCrawlClient(config);
      const result = await client.getStatus('crawl-job-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v2/crawl/crawl-job-123',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer fc-test-api-key',
          }),
        })
      );
    });
  });

  describe('cancel', () => {
    it('should cancel crawl job', async () => {
      const mockResponse = {
        status: 'cancelled',
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new FirecrawlCrawlClient(config);
      const result = await client.cancel('crawl-job-123');

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v2/crawl/crawl-job-123',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });
});
