import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSearchTool } from './index.js';
import type { FirecrawlConfig } from '../../../types.js';

describe('Search Tool', () => {
  let config: FirecrawlConfig;

  beforeEach(() => {
    config = {
      apiKey: 'fc-test-key',
      baseUrl: 'https://api.firecrawl.dev/v2',
    };
  });

  it('should create search tool with proper structure', () => {
    const tool = createSearchTool(config);

    expect(tool.name).toBe('search');
    expect(tool.description).toContain('Search the web');
    expect(tool.inputSchema).toBeDefined();
    expect(typeof tool.handler).toBe('function');
  });

  it('should execute search through handler', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [{ url: 'https://example.com', title: 'Test' }],
        creditsUsed: 2,
      }),
    });

    const tool = createSearchTool(config);
    const result = await tool.handler({ query: 'test', limit: 5 });

    expect(result.isError).toBe(false);
    expect(result.content).toBeDefined();
  });
});
