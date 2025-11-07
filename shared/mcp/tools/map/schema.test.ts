import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mapOptionsSchema } from './schema.js';

describe('Map Options Schema', () => {
  describe('Pagination Parameters', () => {
    it('should accept startIndex parameter with default 0', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });
      expect(result.startIndex).toBe(0);
    });

    it('should accept custom startIndex value', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
        startIndex: 1000,
      });
      expect(result.startIndex).toBe(1000);
    });

    it('should reject negative startIndex', () => {
      expect(() =>
        mapOptionsSchema.parse({
          url: 'https://example.com',
          startIndex: -1,
        })
      ).toThrow();
    });

    it('should accept maxResults parameter with default 200', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });
      expect(result.maxResults).toBe(200);
    });

    it('should accept custom maxResults value', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
        maxResults: 500,
      });
      expect(result.maxResults).toBe(500);
    });

    it('should reject maxResults less than 1', () => {
      expect(() =>
        mapOptionsSchema.parse({
          url: 'https://example.com',
          maxResults: 0,
        })
      ).toThrow();
    });

    it('should reject maxResults greater than 5000', () => {
      expect(() =>
        mapOptionsSchema.parse({
          url: 'https://example.com',
          maxResults: 6000,
        })
      ).toThrow();
    });
  });

  describe('Result Handling Parameter', () => {
    it('should accept resultHandling parameter with default saveAndReturn', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });
      expect(result.resultHandling).toBe('saveAndReturn');
    });

    it('should accept saveOnly mode', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
        resultHandling: 'saveOnly',
      });
      expect(result.resultHandling).toBe('saveOnly');
    });

    it('should accept returnOnly mode', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
        resultHandling: 'returnOnly',
      });
      expect(result.resultHandling).toBe('returnOnly');
    });

    it('should reject invalid resultHandling values', () => {
      expect(() =>
        mapOptionsSchema.parse({
          url: 'https://example.com',
          resultHandling: 'invalid',
        })
      ).toThrow();
    });
  });

  describe('Existing Parameters', () => {
    it('should maintain existing parameter defaults', () => {
      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });
      expect(result.limit).toBe(5000);
      expect(result.sitemap).toBe('include');
      expect(result.includeSubdomains).toBe(true);
      expect(result.ignoreQueryParameters).toBe(true);
      expect(result.location?.country).toBe('US');
    });
  });

  describe('Location Environment Variables', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should use MAP_DEFAULT_COUNTRY from environment', async () => {
      process.env.MAP_DEFAULT_COUNTRY = 'AU';

      // Re-import to get fresh defaults
      vi.resetModules();
      const { mapOptionsSchema } = await import('./schema.js');

      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });

      expect(result.location.country).toBe('AU');
    });

    it('should use MAP_DEFAULT_LANGUAGES from environment', async () => {
      process.env.MAP_DEFAULT_LANGUAGES = 'es-ES,en-US';

      vi.resetModules();
      const { mapOptionsSchema } = await import('./schema.js');

      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });

      expect(result.location.languages).toEqual(['es-ES', 'en-US']);
    });

    it('should fall back to US and en-US if env vars not set', async () => {
      delete process.env.MAP_DEFAULT_COUNTRY;
      delete process.env.MAP_DEFAULT_LANGUAGES;

      vi.resetModules();
      const { mapOptionsSchema } = await import('./schema.js');

      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });

      expect(result.location.country).toBe('US');
      expect(result.location.languages).toEqual(['en-US']);
    });

    it('should use MAP_MAX_RESULTS_PER_PAGE from environment', async () => {
      process.env.MAP_MAX_RESULTS_PER_PAGE = '500';

      vi.resetModules();
      const { mapOptionsSchema } = await import('./schema.js');

      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });

      expect(result.maxResults).toBe(500);
    });

    it('should fall back to 200 if MAP_MAX_RESULTS_PER_PAGE not set', async () => {
      delete process.env.MAP_MAX_RESULTS_PER_PAGE;

      vi.resetModules();
      const { mapOptionsSchema } = await import('./schema.js');

      const result = mapOptionsSchema.parse({
        url: 'https://example.com',
      });

      expect(result.maxResults).toBe(200);
    });
  });
});
