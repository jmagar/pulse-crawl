import { FirecrawlMapClient } from '../../../clients/firecrawl-map.client.js';
import type { FirecrawlConfig } from '../../../types.js';
import { mapOptionsSchema } from './schema.js';
import { mapPipeline } from './pipeline.js';
import { formatMapResponse } from './response.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createMapTool(config: FirecrawlConfig): Tool {
  const client = new FirecrawlMapClient(config);

  return {
    name: 'map',
    description:
      'Discover URLs from a website using Firecrawl. Fast URL discovery (8x faster than crawl) with optional search filtering, sitemap integration, and subdomain handling.',
    inputSchema: zodToJsonSchema(mapOptionsSchema, 'mapOptions'),

    handler: async (args: unknown) => {
      try {
        const validatedArgs = mapOptionsSchema.parse(args);
        const result = await mapPipeline(client, validatedArgs);
        return formatMapResponse(result, validatedArgs.url);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Map error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
