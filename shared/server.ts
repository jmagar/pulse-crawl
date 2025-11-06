import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { registerResources, registerTools } from './mcp/registration.js';
import type { IStrategyConfigClient } from './scraping/strategies/learned/index.js';
import { FilesystemStrategyConfigClient } from './scraping/strategies/learned/index.js';
import { NativeScrapingClient } from './scraping/clients/native/native-scrape-client.js';
import type { CrawlRequestConfig } from './config/crawl-config.js';

// Scraping client interfaces for external services
export interface IFirecrawlClient {
  scrape(
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
  }>;

  startCrawl?: (config: CrawlRequestConfig) => Promise<{
    success: boolean;
    crawlId?: string;
    error?: string;
  }>;
}

export interface INativeFetcher {
  scrape(
    url: string,
    options?: { timeout?: number } & RequestInit
  ): Promise<{
    success: boolean;
    status?: number;
    data?: string;
    error?: string;
  }>;
}

// Native fetcher implementation that uses the enhanced NativeScrapingClient
export class NativeFetcher implements INativeFetcher {
  private client = new NativeScrapingClient();

  async scrape(
    url: string,
    options?: { timeout?: number } & RequestInit
  ): Promise<{
    success: boolean;
    status?: number;
    data?: string;
    error?: string;
  }> {
    const result = await this.client.scrape(url, {
      timeout: options?.timeout,
      headers: options?.headers as Record<string, string>,
      method: options?.method as 'GET' | 'POST',
      body: options?.body as string,
    });

    return {
      success: result.success,
      status: result.statusCode,
      data: result.data,
      error: result.error,
    };
  }
}

// Firecrawl client implementation
export class FirecrawlClient implements IFirecrawlClient {
  constructor(private apiKey: string) {}

  async scrape(
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
    const { scrapeWithFirecrawl } = await import('./scraping/clients/firecrawl/api.js');
    return scrapeWithFirecrawl(this.apiKey, url, options);
  }

  async startCrawl(config: CrawlRequestConfig): Promise<{
    success: boolean;
    crawlId?: string;
    error?: string;
  }> {
    const { startFirecrawlCrawl } = await import('./scraping/clients/firecrawl/api.js');
    return startFirecrawlCrawl(this.apiKey, config);
  }
}

export interface IScrapingClients {
  native: INativeFetcher;
  firecrawl?: IFirecrawlClient;
}

export type ClientFactory = () => IScrapingClients;
export type StrategyConfigFactory = () => IStrategyConfigClient;

export function createMCPServer() {
  const server = new Server(
    {
      name: '@pulsemcp/pulse-fetch',
      version: '0.0.1',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  const registerHandlers = async (
    server: Server,
    clientFactory?: ClientFactory,
    strategyConfigFactory?: StrategyConfigFactory
  ) => {
    // Use provided factory or create default clients
    const factory =
      clientFactory ||
      (() => {
        const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;

        const clients: IScrapingClients = {
          native: new NativeFetcher(),
        };

        if (firecrawlApiKey) {
          clients.firecrawl = new FirecrawlClient(firecrawlApiKey);
        }

        return clients;
      });

    // Use provided strategy config factory or create default
    const configFactory = strategyConfigFactory || (() => new FilesystemStrategyConfigClient());

    registerResources(server);
    registerTools(server, factory, configFactory);
  };

  return { server, registerHandlers };
}
