import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPipeline } from './pipeline.js';
import { FirecrawlSearchClient } from '../../../clients/firecrawl-search.client.js';

vi.mock('../../../clients/firecrawl-search.client.js');

describe('Search Pipeline', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      search: vi.fn(),
    };
  });

  it('should execute search and return results', async () => {
    mockClient.search.mockResolvedValue({
      success: true,
      data: [{ url: 'https://example.com', title: 'Test', description: 'Desc' }],
      creditsUsed: 2,
    });

    const result = await searchPipeline(mockClient, {
      query: 'test query',
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(mockClient.search).toHaveBeenCalledWith({
      query: 'test query',
      limit: 5,
    });
  });

  it('should handle search errors', async () => {
    mockClient.search.mockRejectedValue(new Error('API error'));

    await expect(searchPipeline(mockClient, { query: 'test' })).rejects.toThrow('API error');
  });
});
