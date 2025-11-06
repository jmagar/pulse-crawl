import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { IScrapingClients, StrategyConfigFactory } from '../../../server.js';
import { buildInputSchema } from './schema.js';
import { handleScrapeRequest } from './handler.js';

export function scrapeTool(
  _server: Server,
  clientsFactory: () => IScrapingClients,
  strategyConfigFactory: StrategyConfigFactory
) {
  return {
    name: 'scrape',
    description: `Scrape webpage content using intelligent automatic strategy selection with built-in caching. This tool fetches content from any URL with flexible result handling options.

Result handling modes:
- returnOnly: Returns scraped content without saving (uses maxChars for size limits)
- saveAndReturn: Saves content as MCP Resource AND returns it (default, best for reuse)
- saveOnly: Saves content as MCP Resource, returns only resource link (no content)

Example responses by mode:

returnOnly:
{
  "content": [
    {
      "type": "text",
      "text": "Article content here...\\n\\n---\\nScraped using: native"
    }
  ]
}

saveAndReturn (embedded resource):
{
  "content": [
    {
      "type": "resource",
      "resource": {
        "uri": "scraped://example.com/article_2024-01-15T10:30:00Z",
        "name": "https://example.com/article",
        "text": "Full article content..."
      }
    }
  ]
}

saveOnly (linked resource):
{
  "content": [
    {
      "type": "resource_link",
      "uri": "scraped://example.com/article_2024-01-15T10:30:00Z",
      "name": "https://example.com/article"
    }
  ]
}

Caching behavior:
- Previously scraped URLs are automatically cached as MCP Resources
- Subsequent requests return cached content (unless forceRescrape: true)
- saveOnly mode bypasses cache lookup for efficiency

Scraping strategies:
- native: Direct HTTP fetch (fastest, works for most public sites)
- firecrawl: Advanced scraping with JavaScript rendering (requires FIRECRAWL_API_KEY)

The tool automatically:
1. Checks cache first (except in saveOnly mode)
2. Tries the most appropriate scraping method based on domain patterns
3. Falls back to alternative methods if needed
4. Remembers successful strategies for future requests`,
    inputSchema: buildInputSchema(),
    handler: async (args: unknown) => {
      return await handleScrapeRequest(args, clientsFactory, strategyConfigFactory);
    },
  };
}
