import { z } from 'zod';

export const searchOptionsSchema = z.object({
  query: z.string().min(1, 'Query is required'),
  limit: z.number().int().min(1).max(100).optional().default(5),
  sources: z.array(z.enum(['web', 'images', 'news'])).optional(),
  categories: z.array(z.enum(['github', 'research', 'pdf'])).optional(),
  country: z.string().optional(),
  lang: z.string().optional().default('en'),
  location: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  ignoreInvalidURLs: z.boolean().optional().default(false),
  scrapeOptions: z
    .object({
      formats: z.array(z.string()).optional(),
      onlyMainContent: z.boolean().optional(),
      removeBase64Images: z.boolean().optional().default(true),
      blockAds: z.boolean().optional().default(true),
      waitFor: z.number().int().optional(),
      parsers: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SearchOptions = z.infer<typeof searchOptionsSchema>;
