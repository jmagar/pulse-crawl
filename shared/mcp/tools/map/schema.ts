import { z } from 'zod';

// Read defaults from environment variables
const DEFAULT_COUNTRY = process.env.MAP_DEFAULT_COUNTRY || 'US';
const DEFAULT_LANGUAGES = process.env.MAP_DEFAULT_LANGUAGES
  ? process.env.MAP_DEFAULT_LANGUAGES.split(',').map((lang) => lang.trim())
  : ['en-US'];
const DEFAULT_MAX_RESULTS = process.env.MAP_MAX_RESULTS_PER_PAGE
  ? parseInt(process.env.MAP_MAX_RESULTS_PER_PAGE, 10)
  : 200;

export const mapOptionsSchema = z.object({
  url: z.string().url('Valid URL is required'),
  search: z.string().optional(),
  limit: z.number().int().min(1).max(100000).optional().default(5000),
  sitemap: z.enum(['skip', 'include', 'only']).optional().default('include'),
  includeSubdomains: z.boolean().optional().default(true),
  ignoreQueryParameters: z.boolean().optional().default(true),
  timeout: z.number().int().positive().optional(),
  location: z
    .object({
      country: z.string().optional().default(DEFAULT_COUNTRY),
      languages: z.array(z.string()).optional().default(DEFAULT_LANGUAGES),
    })
    .optional()
    .default({ country: DEFAULT_COUNTRY, languages: DEFAULT_LANGUAGES }),

  // Pagination parameters
  startIndex: z.number().int().min(0, 'startIndex must be non-negative').optional().default(0),
  maxResults: z
    .number()
    .int()
    .min(1, 'maxResults must be at least 1')
    .max(5000, 'maxResults cannot exceed 5000')
    .optional()
    .default(DEFAULT_MAX_RESULTS),

  // Result handling mode
  resultHandling: z
    .enum(['saveOnly', 'saveAndReturn', 'returnOnly'])
    .optional()
    .default('saveAndReturn'),
});

export type MapOptions = z.infer<typeof mapOptionsSchema>;
