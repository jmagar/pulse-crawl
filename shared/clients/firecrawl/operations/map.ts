/**
 * @fileoverview Firecrawl map operation
 *
 * Provides URL discovery within websites using Firecrawl's Map API.
 *
 * @module shared/clients/firecrawl/operations/map
 */

import type { MapOptions, MapResult } from '../types.js';
import { categorizeFirecrawlError } from '../errors.js';

/**
 * Map website URLs using Firecrawl API
 *
 * @param apiKey - Firecrawl API key
 * @param baseUrl - Base URL for Firecrawl API
 * @param options - Map options
 * @returns Map result with discovered URLs
 */
export async function map(
  apiKey: string,
  baseUrl: string,
  options: MapOptions
): Promise<MapResult> {
  const response = await fetch(`${baseUrl}/v2/map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = categorizeFirecrawlError(response.status, errorText);

    throw new Error(
      `Firecrawl Map API Error (${error.code}): ${error.userMessage}\n` +
        `Details: ${error.message}\n` +
        `Retryable: ${error.retryable}${error.retryAfterMs ? ` (retry after ${error.retryAfterMs}ms)` : ''}`
    );
  }

  return response.json();
}
