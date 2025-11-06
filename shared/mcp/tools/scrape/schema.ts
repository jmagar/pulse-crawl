/**
 * @fileoverview Zod schemas and input validation for the scrape tool
 *
 * This module provides schema definitions and validation logic for scraping
 * operations. It dynamically adjusts the schema based on available features
 * (like LLM extraction) and provides user-friendly parameter descriptions.
 *
 * @module shared/mcp/tools/scrape/schema
 */

import { z } from 'zod';
import { ExtractClientFactory } from '../../../processing/extraction/index.js';

/**
 * Parameter descriptions for scraping tool options
 *
 * Single source of truth for parameter documentation used in both
 * Zod schemas and MCP input schemas.
 */
export const PARAM_DESCRIPTIONS = {
  url: 'The webpage URL to scrape (e.g., "https://example.com/article", "https://api.example.com/docs")',
  timeout:
    'Maximum time to wait for page load in milliseconds. Increase for slow-loading sites (e.g., 120000 for 2 minutes). Default: 60000 (1 minute)',
  maxChars:
    'Maximum number of characters to return from the scraped content. Useful for limiting response size. Default: 100000',
  startIndex:
    'Character position to start reading from. Use with maxChars for pagination through large documents (e.g., startIndex: 100000 to skip first 100k chars). Default: 0',
  resultHandling:
    'How to handle scraped content and MCP Resources. Options: "saveOnly" (saves as linked resource, no content returned), "saveAndReturn" (saves as embedded resource and returns content - default), "returnOnly" (returns content without saving). Default: "saveAndReturn"',
  forceRescrape:
    'Force a fresh scrape even if cached content exists for this URL. Useful when you know the content has changed. Default: false',
  cleanScrape:
    "Whether to clean the scraped content by converting HTML to semantic Markdown of what's on the page, removing ads, navigation, and boilerplate. This typically reduces content size by 50-90% while preserving main content. Only disable this for debugging or when you need the exact raw HTML structure. Default: true",
  extract: `Natural language query for intelligent content extraction. Describe what information you want extracted from the scraped page.

Examples:

Simple data extraction:
- "the author name and publication date"
- "all email addresses mentioned on the page"
- "the main product price and availability status"
- "company address and phone number"

Formatted extraction (specify desired format):
- "summarize the main article in 3 bullet points"
- "extract the recipe ingredients as a markdown list"
- "get the pricing tiers as a comparison table in markdown"
- "extract all testimonials with customer names and quotes formatted as markdown blockquotes"

Structured data extraction (request specific output format):
- "extract product details as JSON with fields: name, price, description, specifications"
- "get all job listings as JSON array with title, location, salary, and requirements"
- "extract the FAQ section as JSON with question and answer pairs"
- "parse the contact information into JSON format with fields for address, phone, email, and hours"

Complex queries:
- "analyze the sentiment of customer reviews and categorize them as positive, negative, or neutral"
- "extract and summarize the key features of the product, highlighting unique selling points"
- "identify all dates mentioned and what events they relate to"
- "extract technical specifications and explain them in simple terms"

The LLM will intelligently parse the page content and return only the requested information in a clear, readable format.`,
} as const;

/**
 * Normalize and validate URL format
 *
 * Preprocesses user input to make URL handling more forgiving by:
 * - Trimming whitespace
 * - Adding https:// protocol if missing
 *
 * @param url - Raw URL string from user input
 * @returns Normalized URL with protocol
 *
 * @example
 * ```typescript
 * preprocessUrl('example.com') // Returns: 'https://example.com'
 * preprocessUrl(' https://example.com ') // Returns: 'https://example.com'
 * ```
 */
export function preprocessUrl(url: string): string {
  // Trim whitespace
  url = url.trim();

  // If no protocol is specified, add https://
  if (!url.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:/)) {
    url = 'https://' + url;
  }

  return url;
}

/**
 * Build Zod validation schema for scrape tool arguments
 *
 * Creates a Zod schema that validates scraping parameters. The schema
 * dynamically includes the 'extract' parameter only when LLM extraction
 * is available (configured with API keys).
 *
 * @returns Zod schema for validating scrape arguments
 *
 * @example
 * ```typescript
 * const schema = buildScrapeArgsSchema();
 * const validated = schema.parse({
 *   url: 'example.com', // Will be normalized to https://example.com
 *   timeout: 30000,
 *   extract: 'the main article text' // Only if LLM is available
 * });
 * ```
 */
export const buildScrapeArgsSchema = () => {
  const baseSchema = {
    url: z
      .string()
      .transform(preprocessUrl)
      .pipe(z.string().url())
      .describe(PARAM_DESCRIPTIONS.url),
    timeout: z.number().optional().default(60000).describe(PARAM_DESCRIPTIONS.timeout),
    maxChars: z.number().optional().default(100000).describe(PARAM_DESCRIPTIONS.maxChars),
    startIndex: z.number().optional().default(0).describe(PARAM_DESCRIPTIONS.startIndex),
    resultHandling: z
      .enum(['saveOnly', 'saveAndReturn', 'returnOnly'])
      .optional()
      .default('saveAndReturn')
      .describe(PARAM_DESCRIPTIONS.resultHandling),
    forceRescrape: z.boolean().optional().default(false).describe(PARAM_DESCRIPTIONS.forceRescrape),
    cleanScrape: z.boolean().optional().default(true).describe(PARAM_DESCRIPTIONS.cleanScrape),
  };

  // Only include extract parameter if extraction is available
  if (ExtractClientFactory.isAvailable()) {
    return z.object({
      ...baseSchema,
      extract: z.string().optional().describe(PARAM_DESCRIPTIONS.extract),
    });
  }

  return z.object(baseSchema);
};

/**
 * Build MCP-compatible input schema for scrape tool
 *
 * Creates a JSON Schema compatible with the MCP protocol for tool registration.
 * Like buildScrapeArgsSchema, this dynamically includes the 'extract' parameter
 * only when LLM extraction is available.
 *
 * @returns MCP input schema object with properties and required fields
 *
 * @example
 * ```typescript
 * const schema = buildInputSchema();
 * // Use in MCP tool registration
 * server.setRequestHandler(CallToolRequestSchema, async (request) => {
 *   // Schema is used for validation and documentation
 * });
 * ```
 */
export const buildInputSchema = () => {
  const baseProperties = {
    url: {
      type: 'string',
      format: 'uri',
      description: PARAM_DESCRIPTIONS.url,
    },
    timeout: {
      type: 'number',
      default: 60000,
      description: PARAM_DESCRIPTIONS.timeout,
    },
    maxChars: {
      type: 'number',
      default: 100000,
      description: PARAM_DESCRIPTIONS.maxChars,
    },
    startIndex: {
      type: 'number',
      default: 0,
      description: PARAM_DESCRIPTIONS.startIndex,
    },
    resultHandling: {
      type: 'string',
      enum: ['saveOnly', 'saveAndReturn', 'returnOnly'],
      default: 'saveAndReturn',
      description: PARAM_DESCRIPTIONS.resultHandling,
    },
    forceRescrape: {
      type: 'boolean',
      default: false,
      description: PARAM_DESCRIPTIONS.forceRescrape,
    },
    cleanScrape: {
      type: 'boolean',
      default: true,
      description: PARAM_DESCRIPTIONS.cleanScrape,
    },
  };

  // Only include extract parameter if extraction is available
  if (ExtractClientFactory.isAvailable()) {
    return {
      type: 'object' as const,
      properties: {
        ...baseProperties,
        extract: {
          type: 'string',
          description: PARAM_DESCRIPTIONS.extract,
        },
      },
      required: ['url'],
    };
  }

  return {
    type: 'object' as const,
    properties: baseProperties,
    required: ['url'],
  };
};
