import type { CrawlRequestConfig } from '../../../config/crawl-config.js';

// Validate and cache the base URL at module load time
const getBaseUrl = (): string => {
  const baseUrl = process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev';

  // Validate baseUrl to prevent injection attacks
  if (baseUrl && (!/^https?:\/\/[^\\]+$/.test(baseUrl) || baseUrl.includes('..'))) {
    throw new Error('Invalid FIRECRAWL_BASE_URL');
  }

  return baseUrl;
};

const FIRECRAWL_BASE_URL = getBaseUrl();

export async function scrapeWithFirecrawl(
  apiKey: string,
  url: string,
  options?: Record<string, unknown>
): Promise<{
  success: boolean;
  data?: {
    content: string;
    markdown: string;
    html: string;
    metadata: Record<string, unknown>;
  };
  error?: string;
}> {
  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/v1/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        ...options,
      }),
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error || errorJson.message || '';
      } catch {
        errorDetail = await response.text();
      }
      return {
        success: false,
        error: `Firecrawl API error: ${response.status} ${response.statusText}${errorDetail ? ` - ${errorDetail}` : ''}`,
      };
    }

    const result = await response.json();

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Firecrawl scraping failed',
      };
    }

    return {
      success: true,
      data: {
        content: result.data?.content || '',
        markdown: result.data?.markdown || '',
        html: result.data?.html || '',
        metadata: result.data?.metadata || {},
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Firecrawl error',
    };
  }
}

export async function startFirecrawlCrawl(
  apiKey: string,
  config: CrawlRequestConfig
): Promise<{
  success: boolean;
  crawlId?: string;
  error?: string;
}> {
  const payload = {
    url: config.url,
    maxDepth: Math.max(config.maxDepth, 3),
    changeDetection: config.changeDetection,
    excludePaths: config.excludePaths,
    scrapeOptions: {
      formats: ['markdown', 'html'],
    },
  };

  try {
    const response = await fetch(`${FIRECRAWL_BASE_URL}/v2/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errorJson = await response.json();
        errorDetail = errorJson.error || errorJson.message || '';
      } catch {
        errorDetail = await response.text();
      }

      return {
        success: false,
        error: `Firecrawl crawl error: ${response.status} ${response.statusText}${errorDetail ? ` - ${errorDetail}` : ''}`,
      };
    }

    const result = await response.json().catch(() => ({}));
    const crawlId = result?.jobId || result?.id || result?.data?.jobId;

    return {
      success: result?.success !== false,
      crawlId,
      error: result?.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown Firecrawl crawl error',
    };
  }
}
