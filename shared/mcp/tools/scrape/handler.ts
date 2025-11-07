import { z } from 'zod';
import { ExtractClientFactory } from '../../../processing/extraction/index.js';
import type { IScrapingClients, StrategyConfigFactory } from '../../../server.js';
import { buildScrapeArgsSchema } from './schema.js';
import { checkCache, scrapeContent, processContent, saveToStorage } from './pipeline.js';
import {
  buildCachedResponse,
  buildErrorResponse,
  buildSuccessResponse,
  type ToolResponse,
} from './response.js';

export async function handleScrapeRequest(
  args: unknown,
  clientsFactory: () => IScrapingClients,
  strategyConfigFactory: StrategyConfigFactory
): Promise<ToolResponse> {
  try {
    const ScrapeArgsSchema = buildScrapeArgsSchema();
    const validatedArgs = ScrapeArgsSchema.parse(args);
    const clients = clientsFactory();
    const configClient = strategyConfigFactory();

    const { url, maxChars, startIndex, timeout, forceRescrape, cleanScrape, resultHandling } =
      validatedArgs;

    // Type-safe extraction of optional extract parameter
    let extract: string | undefined;
    if (ExtractClientFactory.isAvailable() && 'extract' in validatedArgs) {
      extract = (validatedArgs as { extract?: string }).extract;
    }

    // Check for cached resources
    const cachedResult = await checkCache(url, extract, resultHandling, forceRescrape);
    if (cachedResult.found) {
      return buildCachedResponse(
        cachedResult.content,
        cachedResult.uri,
        cachedResult.name,
        cachedResult.mimeType,
        cachedResult.description,
        cachedResult.source,
        cachedResult.timestamp,
        resultHandling,
        startIndex,
        maxChars
      );
    }

    // Scrape fresh content
    const scrapeResult = await scrapeContent(url, timeout, clients, configClient);

    if (!scrapeResult.success) {
      return buildErrorResponse(url, scrapeResult.error, scrapeResult.diagnostics);
    }

    const rawContent = scrapeResult.content!;
    const source = scrapeResult.source!;

    // Process content through cleaning and extraction pipeline
    const { cleaned, extracted, displayContent } = await processContent(
      rawContent,
      url,
      cleanScrape,
      extract
    );

    // Save to storage if needed
    let savedUris = null;
    if (resultHandling === 'saveOnly' || resultHandling === 'saveAndReturn') {
      // Need to determine wasTruncated for metadata
      const wasTruncated = resultHandling !== 'saveOnly' && displayContent.length > maxChars;

      savedUris = await saveToStorage(
        url,
        rawContent,
        cleaned,
        extracted,
        extract,
        source,
        startIndex,
        maxChars,
        wasTruncated
      );
    }

    // Build and return response
    return buildSuccessResponse(
      url,
      displayContent,
      rawContent,
      cleaned,
      extracted,
      extract,
      source,
      resultHandling,
      startIndex,
      maxChars,
      savedUris
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        content: [
          {
            type: 'text',
            text: `Invalid arguments: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Failed to scrape ${(args as { url?: string })?.url || 'URL'}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
      ],
      isError: true,
    };
  }
}
