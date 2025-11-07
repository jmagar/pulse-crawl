/**
 * @fileoverview Firecrawl search operation
 *
 * Provides search functionality using Firecrawl's search API.
 *
 * @module shared/clients/firecrawl/operations/search
 */

import type { SearchOptions, SearchResult } from '../types.js';

/**
 * Search using Firecrawl API
 *
 * @param apiKey - Firecrawl API key
 * @param baseUrl - Base URL for Firecrawl API
 * @param options - Search options
 * @returns Search results
 */
export async function search(
  apiKey: string,
  baseUrl: string,
  options: SearchOptions
): Promise<SearchResult> {
  const response = await fetch(`${baseUrl}/v2/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
  }

  return response.json();
}
