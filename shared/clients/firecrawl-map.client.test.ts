import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirecrawlMapClient } from './firecrawl-map.client.js';
import type { FirecrawlConfig } from '../types.js';

describe('FirecrawlMapClient', () => {
  let config: FirecrawlConfig;

  beforeEach(() => {
    config = {
      apiKey: 'fc-test-api-key',
      baseUrl: 'https://api.firecrawl.dev/v2',
    };
  });

  describe('initialization', () => {
    it('should create instance with valid config', () => {
      const client = new FirecrawlMapClient(config);
      expect(client).toBeInstanceOf(FirecrawlMapClient);
    });
  });

  describe('map', () => {
    it('should map website URLs and return links', async () => {
      const mockResponse = {
        success: true,
        links: [
          {
            url: 'https://example.com/page1',
            title: 'Page 1',
            description: 'Description 1',
          },
          {
            url: 'https://example.com/page2',
            title: 'Page 2',
          },
        ],
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const client = new FirecrawlMapClient(config);
      const result = await client.map({ url: 'https://example.com', limit: 100 });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.firecrawl.dev/v2/map',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer fc-test-api-key',
          }),
          body: JSON.stringify({ url: 'https://example.com', limit: 100 }),
        })
      );
    });

    it('should handle search parameter for filtering', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, links: [] }),
      });

      const client = new FirecrawlMapClient(config);
      await client.map({ url: 'https://example.com', search: 'docs', limit: 50 });

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ url: 'https://example.com', search: 'docs', limit: 50 }),
        })
      );
    });
  });
});
