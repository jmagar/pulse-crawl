import type { MapResult } from '../../../clients/firecrawl-map.client.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function formatMapResponse(result: MapResult, url: string): CallToolResult {
  const content: CallToolResult['content'] = [];

  content.push({
    type: 'text',
    text: `Discovered ${result.links.length} URLs from ${url}`,
  });

  content.push({
    type: 'resource',
    resource: {
      uri: `pulse-fetch://map/${new URL(url).hostname}/${Date.now()}`,
      name: `URL Map: ${url}`,
      mimeType: 'application/json',
      text: JSON.stringify(result.links, null, 2),
    },
  });

  return { content, isError: false };
}
