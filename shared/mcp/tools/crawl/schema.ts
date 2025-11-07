import { z } from 'zod';
import { browserActionsArraySchema } from '../scrape/action-types.js';

/**
 * Flattened schema for crawl tool
 *
 * Supports two operation modes:
 * 1. Start a new crawl: Provide `url` (jobId must be absent)
 * 2. Check status or cancel: Provide `jobId` (url must be absent)
 *
 * Note: Both url and jobId are optional in the schema to avoid anyOf/oneOf
 * at the root level (which Anthropic's API doesn't support). The handler
 * validates that exactly one is provided.
 */
export const crawlOptionsSchema = z
  .object({
    // Required for starting a new crawl (mutually exclusive with jobId)
    url: z.string().url('Valid URL is required').optional(),

    // Required for checking status or canceling (mutually exclusive with url)
    jobId: z.string().min(1, 'Job ID is required').optional(),

    // Operation flag for jobId mode
    cancel: z.boolean().optional().default(false),

    // Natural language prompt for Firecrawl to generate optimal crawl parameters
    prompt: z
      .string()
      .optional()
      .describe(
        'Natural language prompt describing the crawl you want to perform. ' +
          'Firecrawl will automatically generate optimal crawl parameters based on your description. ' +
          'Examples: ' +
          '"Find all blog posts about AI from the past year", ' +
          '"Crawl the documentation section and extract API endpoints", ' +
          '"Get all product pages with pricing information", ' +
          '"Map the entire site but exclude admin pages". ' +
          'When provided, this takes precedence over manual parameters like limit, maxDepth, etc.'
      ),

    // Crawl configuration options (only used with url)
    limit: z.number().int().min(1).max(100000).optional().default(100),
    maxDepth: z.number().int().min(1).optional(),
    crawlEntireDomain: z.boolean().optional().default(false),
    allowSubdomains: z.boolean().optional().default(false),
    allowExternalLinks: z.boolean().optional().default(false),
    includePaths: z.array(z.string()).optional(),
    excludePaths: z.array(z.string()).optional(),
    ignoreQueryParameters: z.boolean().optional().default(true),
    sitemap: z.enum(['include', 'skip']).optional().default('include'),
    delay: z.number().int().min(0).optional(),
    maxConcurrency: z.number().int().min(1).optional(),
    scrapeOptions: z
      .object({
        formats: z.array(z.string()).optional().default(['markdown']),
        onlyMainContent: z.boolean().optional().default(true),
        includeTags: z.array(z.string()).optional(),
        excludeTags: z.array(z.string()).optional(),
        actions: browserActionsArraySchema
          .optional()
          .describe(
            'Browser actions to perform on each page before scraping. ' +
              'Same action types as scrape tool: wait, click, write, press, scroll, screenshot, scrape, executeJavascript. ' +
              'Applied to every page in the crawl.'
          ),
      })
      .optional(),
  })
  // Note: When 'prompt' is provided, Firecrawl API will use it to generate
  // optimal parameters. Manual parameters (limit, maxDepth, etc.) are still
  // sent but may be overridden by the AI-generated configuration.
  .refine(
    (data) => {
      // Exactly one of url or jobId must be provided
      const hasUrl = !!data.url;
      const hasJobId = !!data.jobId;
      return hasUrl !== hasJobId; // XOR: one must be true, the other false
    },
    {
      message: 'Provide either "url" to start a crawl, or "jobId" to check status/cancel',
    }
  );

export type CrawlOptions = z.infer<typeof crawlOptionsSchema>;
