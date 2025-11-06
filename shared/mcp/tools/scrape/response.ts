import { detectContentType } from './helpers.js';

export interface ResponseContent {
  type: string;
  text?: string;
  uri?: string;
  name?: string;
  mimeType?: string;
  description?: string;
  resource?: {
    uri: string;
    name?: string;
    mimeType?: string;
    description?: string;
    text?: string;
  };
}

export interface ToolResponse {
  content: ResponseContent[];
  isError?: boolean;
}

/**
 * Apply pagination to content
 */
export function applyPagination(
  content: string,
  startIndex: number,
  maxChars: number
): { processedContent: string; wasTruncated: boolean } {
  let processedContent = content;
  let wasTruncated = false;

  if (startIndex > 0) {
    processedContent = processedContent.slice(startIndex);
  }

  if (processedContent.length > maxChars) {
    processedContent = processedContent.slice(0, maxChars);
    wasTruncated = true;
  }

  return { processedContent, wasTruncated };
}

/**
 * Build response for cached content
 */
export function buildCachedResponse(
  cachedContent: string,
  cachedUri: string,
  cachedName: string,
  cachedMimeType: string | undefined,
  cachedDescription: string | undefined,
  cachedSource: string,
  cachedTimestamp: string,
  resultHandling: string,
  startIndex: number,
  maxChars: number
): ToolResponse {
  const { processedContent, wasTruncated } = applyPagination(cachedContent, startIndex, maxChars);

  // Format output
  let resultText = processedContent;
  if (wasTruncated) {
    resultText += `\n\n[Content truncated at ${maxChars} characters. Use startIndex parameter to continue reading from character ${startIndex + maxChars}]`;
  }
  resultText += `\n\n---\nServed from cache (originally scraped using: ${cachedSource})\nCached at: ${cachedTimestamp}`;

  // Return based on resultHandling mode
  if (resultHandling === 'returnOnly') {
    return {
      content: [
        {
          type: 'text',
          text: resultText,
        },
      ],
    };
  } else if (resultHandling === 'saveAndReturn') {
    return {
      content: [
        {
          type: 'resource',
          resource: {
            uri: cachedUri,
            name: cachedName,
            mimeType: cachedMimeType,
            description: cachedDescription,
            text: processedContent,
          },
        },
      ],
    };
  } else {
    throw new Error('Invalid state: saveOnly mode should bypass cache');
  }
}

/**
 * Build error response with diagnostics
 */
export function buildErrorResponse(
  url: string,
  error: string | undefined,
  diagnostics: any | undefined
): ToolResponse {
  let errorMessage = `Failed to scrape ${url}`;

  if (diagnostics) {
    errorMessage += `\n\nDiagnostics:\n`;
    errorMessage += `- Strategies attempted: ${diagnostics.strategiesAttempted.join(', ')}\n`;

    if (Object.keys(diagnostics.strategyErrors).length > 0) {
      errorMessage += `- Strategy errors:\n`;
      for (const [strategy, strategyError] of Object.entries(diagnostics.strategyErrors)) {
        errorMessage += `  - ${strategy}: ${strategyError}\n`;
      }
    }

    if (diagnostics.timing && Object.keys(diagnostics.timing).length > 0) {
      errorMessage += `- Timing:\n`;
      for (const [strategy, ms] of Object.entries(diagnostics.timing)) {
        errorMessage += `  - ${strategy}: ${ms}ms\n`;
      }
    }
  } else {
    errorMessage += `: ${error || 'All scraping strategies failed'}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: errorMessage,
      },
    ],
    isError: true,
  };
}

/**
 * Build response for successfully scraped content
 */
export function buildSuccessResponse(
  url: string,
  displayContent: string,
  rawContent: string,
  cleanedContent: string | undefined,
  extractedContent: string | undefined,
  extract: string | undefined,
  source: string,
  resultHandling: string,
  startIndex: number,
  maxChars: number,
  savedUris: { raw?: string; cleaned?: string; extracted?: string } | null
): ToolResponse {
  const response: ToolResponse = {
    content: [],
  };

  // Apply pagination only for return options
  let processedContent = displayContent;
  let wasTruncated = false;

  if (resultHandling !== 'saveOnly') {
    const paginationResult = applyPagination(displayContent, startIndex, maxChars);
    processedContent = paginationResult.processedContent;
    wasTruncated = paginationResult.wasTruncated;
  }

  // Format output for return options
  let resultText = '';
  if (resultHandling !== 'saveOnly') {
    resultText = processedContent;
    if (wasTruncated) {
      resultText += `\n\n[Content truncated at ${maxChars} characters. Use startIndex parameter to continue reading from character ${startIndex + maxChars}]`;
    }
    resultText += `\n\n---\nScraped using: ${source}`;
  }

  // Add text content for returnOnly option
  if (resultHandling === 'returnOnly') {
    response.content.push({
      type: 'text',
      text: resultText,
    });
  }

  // Save as a resource for save options
  if ((resultHandling === 'saveOnly' || resultHandling === 'saveAndReturn') && savedUris) {
    // Use the most processed version
    const primaryUri = extractedContent
      ? savedUris.extracted
      : cleanedContent
        ? savedUris.cleaned
        : savedUris.raw;

    const resourceDescription = extract
      ? `Extracted information from ${url} using query: "${extract}"`
      : `Scraped content from ${url}`;

    // Determine MIME type based on what content we're actually storing/returning
    const contentMimeType =
      extractedContent || cleanedContent ? 'text/markdown' : detectContentType(rawContent);

    if (resultHandling === 'saveOnly') {
      response.content.push({
        type: 'resource_link',
        uri: primaryUri!,
        name: url,
        mimeType: contentMimeType,
        description: resourceDescription,
      });
    } else if (resultHandling === 'saveAndReturn') {
      response.content.push({
        type: 'resource',
        resource: {
          uri: primaryUri!,
          name: url,
          mimeType: contentMimeType,
          description: resourceDescription,
          text: displayContent,
        },
      });
    }
  }

  return response;
}
