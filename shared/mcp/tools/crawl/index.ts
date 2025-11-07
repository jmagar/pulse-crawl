import { FirecrawlCrawlClient } from '../../../clients/firecrawl-crawl.client.js';
import type { FirecrawlConfig } from '../../../types.js';
import { crawlOptionsSchema } from './schema.js';
import { crawlPipeline } from './pipeline.js';
import { formatCrawlResponse } from './response.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export function createCrawlTool(config: FirecrawlConfig): Tool {
  const client = new FirecrawlCrawlClient(config);

  return {
    name: 'crawl',
    description:
      'Manage website crawling jobs. Start a crawl with url parameter, check status with jobId, or cancel with jobId + cancel=true.',
    inputSchema: zodToJsonSchema(crawlOptionsSchema) as any,

    handler: async (args: unknown) => {
      try {
        const validatedArgs = crawlOptionsSchema.parse(args);
        const result = await crawlPipeline(client, validatedArgs);
        return formatCrawlResponse(result);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Crawl error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    },
  };
}
