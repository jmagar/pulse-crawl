import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMapTool } from './index.js';
import type { FirecrawlConfig } from '../../../types.js';

describe('Map Tool', () => {
  let config: FirecrawlConfig;

  beforeEach(() => {
    config = {
      apiKey: 'fc-test-key',
      baseUrl: 'https://api.firecrawl.dev/v2',
    };
  });

  it('should create map tool with proper structure', () => {
    const tool = createMapTool(config);

    expect(tool.name).toBe('map');
    expect(tool.description).toContain('Discover URLs');
    expect(tool.inputSchema).toBeDefined();
  });

  it('should execute map through handler', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        links: [
          { url: 'https://example.com/page1', title: 'Page 1' },
          { url: 'https://example.com/page2', title: 'Page 2' },
        ],
      }),
    });

    const tool = createMapTool(config);

    if (typeof tool.handler !== 'function') {
      throw new Error('Tool handler is not a function');
    }

    const result = (await tool.handler({ url: 'https://example.com', limit: 100 })) as {
      isError?: boolean;
      content?: unknown;
    };

    expect(result.isError).toBe(false);
    expect(result.content).toBeDefined();
  });
});
