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
  tbs: z
    .string()
    .optional()
    .describe(
      'Time-based search filter. Filters results by date range. ' +
        'Valid values: ' +
        'qdr:h (past hour), qdr:d (past day), qdr:w (past week), qdr:m (past month), qdr:y (past year), ' +
        'or custom range: cdr:a,cd_min:MM/DD/YYYY,cd_max:MM/DD/YYYY. ' +
        'Examples: "qdr:d" (past 24 hours), "qdr:w" (past week), "cdr:a,cd_min:01/01/2024,cd_max:12/31/2024" (custom range)'
    ),
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
