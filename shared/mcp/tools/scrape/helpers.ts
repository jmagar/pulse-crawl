import type { IScrapingClients } from '../../../server.js';
import { buildCrawlRequestConfig, shouldStartCrawl } from '../../../config/crawl-config.js';

// Detect content type based on content
export function detectContentType(content: string): string {
  // Check if content is HTML
  const htmlRegex =
    /<(!DOCTYPE\s+)?html[^>]*>|<head[^>]*>|<body[^>]*>|<div[^>]*>|<p[^>]*>|<h[1-6][^>]*>/i;
  if (htmlRegex.test(content.substring(0, 1000))) {
    return 'text/html';
  }

  // Check if content is JSON
  try {
    JSON.parse(content);
    return 'application/json';
  } catch {
    // Not JSON
  }

  // Check if content is XML
  const xmlRegex = /^\s*<\?xml[^>]*\?>|^\s*<[^>]+>/;
  if (xmlRegex.test(content)) {
    return 'application/xml';
  }

  // Default to plain text
  return 'text/plain';
}

// Start async crawl of base URL using Firecrawl
export function startBaseUrlCrawl(url: string, clients: IScrapingClients): void {
  if (!clients.firecrawl) return;
  if (typeof clients.firecrawl.startCrawl !== 'function') return;
  if (!shouldStartCrawl(url)) return;

  const crawlConfig = buildCrawlRequestConfig(url);
  if (!crawlConfig) return;

  Promise.resolve(clients.firecrawl.startCrawl(crawlConfig))
    .then((result) => {
      if (!result.success) {
        console.warn(
          `Firecrawl crawl failed for ${crawlConfig.url}: ${result.error || 'Unknown error'}`
        );
      }
    })
    .catch((error) => {
      console.warn('Firecrawl crawl request error:', error);
    });
}
