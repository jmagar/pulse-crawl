import { z } from 'zod';

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
      })
      .optional(),
  })
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
