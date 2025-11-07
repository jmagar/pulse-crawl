import type {
  FirecrawlMapClient,
  MapOptions as ClientMapOptions,
  MapResult,
} from '../../../clients/firecrawl/index.js';
import type { MapOptions } from './schema.js';

export async function mapPipeline(
  client: FirecrawlMapClient,
  options: MapOptions
): Promise<MapResult> {
  const clientOptions: ClientMapOptions = {
    url: options.url,
    search: options.search,
    limit: options.limit,
    sitemap: options.sitemap,
    includeSubdomains: options.includeSubdomains,
    ignoreQueryParameters: options.ignoreQueryParameters,
    timeout: options.timeout,
    location: options.location,
  };

  return await client.map(clientOptions);
}
