import type {
  StartCrawlResult,
  CrawlStatusResult,
  CancelResult,
} from '../../../clients/firecrawl/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

export function formatCrawlResponse(
  result: StartCrawlResult | CrawlStatusResult | CancelResult
): CallToolResult {
  // Check which type of result we have
  if ('id' in result && 'url' in result) {
    // StartCrawlResult
    return {
      content: [
        {
          type: 'text',
          text: `Crawl job started successfully!\n\nJob ID: ${result.id}\nStatus URL: ${result.url}\n\nUse crawl tool with jobId "${result.id}" to check progress.`,
        },
      ],
      isError: false,
    };
  } else if ('status' in result && 'completed' in result) {
    // CrawlStatusResult
    const statusResult = result as CrawlStatusResult;
    const content: CallToolResult['content'] = [];

    content.push({
      type: 'text',
      text: `Crawl Status: ${statusResult.status}\nProgress: ${statusResult.completed}/${statusResult.total} pages\nCredits used: ${statusResult.creditsUsed}\nExpires at: ${statusResult.expiresAt}`,
    });

    if (statusResult.data.length > 0) {
      content.push({
        type: 'resource',
        resource: {
          uri: `pulse-crawl://crawl/results/${Date.now()}`,
          name: `Crawl Results (${statusResult.completed} pages)`,
          mimeType: 'application/json',
          text: JSON.stringify(statusResult.data, null, 2),
        },
      });
    }

    if (statusResult.next) {
      content.push({
        type: 'text',
        text: `\nMore results available. Use pagination URL: ${statusResult.next}`,
      });
    }

    return { content, isError: false };
  } else {
    // CancelResult
    return {
      content: [
        {
          type: 'text',
          text: `Crawl job cancelled successfully. Status: ${(result as CancelResult).status}`,
        },
      ],
      isError: false,
    };
  }
}
