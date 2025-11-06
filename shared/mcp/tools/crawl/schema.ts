import { z } from 'zod';

// Schema for starting a crawl (when url is provided)
const startCrawlSchema = z.object({
  url: z.string().url('Valid URL is required'),
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
});

// Schema for checking status or canceling (when jobId is provided)
const jobOperationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  cancel: z.boolean().optional().default(false),
});

// Union: either url (start) or jobId (status/cancel)
export const crawlOptionsSchema = startCrawlSchema.or(jobOperationSchema);

export type CrawlOptions = z.infer<typeof crawlOptionsSchema>;
