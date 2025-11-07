/**
 * @fileoverview Scraping pipeline orchestration
 *
 * Coordinates the end-to-end scraping workflow including cache lookup,
 * content fetching, cleaning, extraction, and storage operations.
 *
 * @module shared/mcp/tools/scrape/pipeline
 */

import { ResourceStorageFactory } from '../../../storage/index.js';
import { ExtractClientFactory } from '../../../processing/extraction/index.js';
import { createCleaner } from '../../../processing/cleaning/index.js';
import type { IScrapingClients, StrategyConfigFactory } from '../../../server.js';
import { scrapeWithStrategy } from '../../../scraping/strategies/selector.js';
import { detectContentType, startBaseUrlCrawl } from './helpers.js';
import type { ScrapeDiagnostics } from '../../../types.js';
import { logWarning, logError } from '../../../utils/logging.js';

/**
 * Configuration options for scraping pipeline
 *
 * Defines all parameters needed to execute a complete scraping operation
 * including caching, content processing, and result handling.
 */
export interface ScrapePipelineOptions {
  url: string;
  timeout: number;
  maxChars: number;
  startIndex: number;
  resultHandling: 'saveOnly' | 'saveAndReturn' | 'returnOnly';
  forceRescrape: boolean;
  cleanScrape: boolean;
  extract?: string;
}

/**
 * Result of content processing pipeline
 *
 * Contains content in multiple stages (raw, cleaned, extracted) along
 * with metadata about the processing and caching status.
 */
export interface ProcessedContent {
  raw: string;
  cleaned?: string;
  extracted?: string;
  displayContent: string;
  source: string;
  wasCached: boolean;
}

/**
 * Check for cached content and return if found
 */
export async function checkCache(
  url: string,
  extract: string | undefined,
  resultHandling: string,
  forceRescrape: boolean
): Promise<
  | {
      found: true;
      content: string;
      uri: string;
      name: string;
      mimeType?: string;
      description?: string;
      source: string;
      timestamp: string;
    }
  | { found: false }
> {
  // Skip cache if forceRescrape or saveOnly mode
  if (forceRescrape || resultHandling === 'saveOnly') {
    return { found: false };
  }

  try {
    const storage = await ResourceStorageFactory.create();

    // Use findByUrlAndExtract if available and extract is provided
    let cachedResources;
    if (extract && storage.findByUrlAndExtract) {
      cachedResources = await storage.findByUrlAndExtract(url, extract);
    } else {
      cachedResources = await storage.findByUrl(url);
    }

    if (cachedResources.length > 0) {
      const cachedResource = cachedResources[0];
      const cachedContent = await storage.read(cachedResource.uri);

      return {
        found: true,
        content: cachedContent.text || '',
        uri: cachedResource.uri,
        name: cachedResource.name,
        mimeType: cachedResource.mimeType,
        description: cachedResource.description,
        source: (cachedResource.metadata.source as string) || 'unknown',
        timestamp: cachedResource.metadata.timestamp as string,
      };
    }
  } catch (error) {
    logWarning('checkCache', 'Cache lookup failed, proceeding with fresh scrape', { url, error });
  }

  return { found: false };
}

/**
 * Scrape content from URL
 */
export async function scrapeContent(
  url: string,
  timeout: number,
  clients: IScrapingClients,
  configClient: ReturnType<StrategyConfigFactory>
): Promise<{
  success: boolean;
  content?: string;
  source?: string;
  error?: string;
  diagnostics?: ScrapeDiagnostics;
}> {
  const result = await scrapeWithStrategy(clients, configClient, {
    url,
    timeout,
  });

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      diagnostics: result.diagnostics,
    };
  }

  // Kick off async crawl of base URL using Firecrawl
  startBaseUrlCrawl(url, clients);

  return {
    success: true,
    content: result.content || '',
    source: result.source,
  };
}

/**
 * Process content through cleaning and extraction pipeline
 */
export async function processContent(
  rawContent: string,
  url: string,
  cleanScrape: boolean,
  extract: string | undefined
): Promise<{ cleaned?: string; extracted?: string; displayContent: string }> {
  let cleanedContent: string | undefined;
  let extractedContent: string | undefined;
  let displayContent = rawContent;

  // Apply cleaning if cleanScrape is true (default)
  if (cleanScrape) {
    try {
      const cleaner = createCleaner(rawContent, url);
      cleanedContent = await cleaner.clean(rawContent, url);
      if (cleanedContent) {
        displayContent = cleanedContent;
      }
    } catch (cleanError) {
      logWarning('processContent', 'Content cleaning failed, proceeding with raw content', {
        url,
        error: cleanError,
      });
      displayContent = rawContent;
    }
  }

  // If extract parameter is provided and extraction is available, perform extraction
  if (extract && ExtractClientFactory.isAvailable()) {
    try {
      const extractClient = ExtractClientFactory.createFromEnv();
      if (extractClient) {
        const contentToExtract = cleanedContent || rawContent;
        const extractResult = await extractClient.extract(contentToExtract, extract);
        if (extractResult.success && extractResult.content) {
          extractedContent = extractResult.content;
          displayContent = extractedContent;
        } else {
          displayContent = `Extraction failed: ${extractResult.error}\n\n---\nRaw content:\n${displayContent}`;
        }
      }
    } catch (error) {
      logError('processContent', error, { url, extract });
      displayContent = `Extraction error: ${error instanceof Error ? error.message : String(error)}\n\n---\nRaw content:\n${displayContent}`;
    }
  }

  return {
    cleaned: cleanedContent,
    extracted: extractedContent,
    displayContent,
  };
}

/**
 * Save processed content to storage
 */
export async function saveToStorage(
  url: string,
  rawContent: string,
  cleanedContent: string | undefined,
  extractedContent: string | undefined,
  extract: string | undefined,
  source: string,
  startIndex: number,
  maxChars: number,
  wasTruncated: boolean
): Promise<{ raw?: string; cleaned?: string; extracted?: string } | null> {
  try {
    const storage = await ResourceStorageFactory.create();
    const uris = await storage.writeMulti({
      url,
      raw: rawContent,
      cleaned: cleanedContent,
      extracted: extractedContent,
      metadata: {
        url,
        source,
        timestamp: new Date().toISOString(),
        extract: extract || undefined,
        contentLength: rawContent.length,
        startIndex,
        maxChars,
        wasTruncated,
        contentType: detectContentType(rawContent),
      },
    });

    return uris;
  } catch (error) {
    logError('saveToStorage', error, { url, source });
    return null;
  }
}
