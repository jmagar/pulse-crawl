import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { TestMCPClient } from '../../../../libs/test-mcp-client/build/index.js';
import { existsSync } from 'fs';

interface MockConfig {
  nativeSuccess?: boolean;
  nativeData?: string;
  nativeStatus?: number;
  enableFirecrawl?: boolean;
  firecrawlSuccess?: boolean;
  firecrawlData?: string;
}

interface TestMode {
  name: string;
  serverPath: string;
  setup?: () => Promise<void>;
}

/**
 * Helper function to create a TestMCPClient with mocked scraping clients.
 */
async function createTestMCPClientWithMocks(
  serverPath: string,
  config: MockConfig
): Promise<TestMCPClient> {
  const env: Record<string, string> = {};

  // Native fetcher mocks
  if (config.nativeSuccess !== undefined) {
    env.MOCK_NATIVE_SUCCESS = config.nativeSuccess.toString();
  }
  if (config.nativeData) {
    env.MOCK_NATIVE_DATA = config.nativeData;
  }
  if (config.nativeStatus) {
    env.MOCK_NATIVE_STATUS = config.nativeStatus.toString();
  }

  // Firecrawl mocks
  if (config.enableFirecrawl) {
    env.ENABLE_FIRECRAWL_MOCK = 'true';
    if (config.firecrawlSuccess !== undefined) {
      env.MOCK_FIRECRAWL_SUCCESS = config.firecrawlSuccess.toString();
    }
    if (config.firecrawlData) {
      env.MOCK_FIRECRAWL_DATA = config.firecrawlData;
    }
  }

  const client = new TestMCPClient({
    serverPath,
    env,
    debug: false,
  });

  await client.connect();
  return client;
}

/**
 * Run integration tests in a specific mode (source or built)
 */
export function runIntegrationTests(mode: TestMode) {
  describe(`Pulse Fetch MCP Server Integration Tests [${mode.name}]`, () => {
    let client: TestMCPClient | null = null;

    beforeAll(async () => {
      if (mode.setup) {
        await mode.setup();
      }

      // Verify the server file exists
      if (!existsSync(mode.serverPath)) {
        throw new Error(
          `Server file not found at ${mode.serverPath}. Make sure to build the project first.`
        );
      }
    }, 30000); // 30 second timeout for setup

    afterEach(async () => {
      if (client) {
        await client.disconnect();
        client = null;
      }
    });

    describe('Tools', () => {
      it('should execute scrape tool with native success', async () => {
        client = await createTestMCPClientWithMocks(mode.serverPath, {
          nativeSuccess: true,
          nativeData: 'Native scrape success!',
        });

        const result = await client.callTool('scrape', {
          url: 'https://example.com',
          resultHandling: 'returnOnly',
        });

        expect(result).toMatchObject({
          content: [
            {
              type: 'text',
              text: expect.stringContaining('Native scrape success!'),
            },
          ],
        });
        expect(result.content[0].text).toContain('Scraped using: native');
      });

      it('should fallback to Firecrawl when native fails', async () => {
        client = await createTestMCPClientWithMocks(mode.serverPath, {
          nativeSuccess: false,
          enableFirecrawl: true,
          firecrawlSuccess: true,
          firecrawlData: 'Firecrawl fallback success!',
        });

        const result = await client.callTool('scrape', {
          url: 'https://example.com',
          resultHandling: 'returnOnly',
        });

        expect(result).toMatchObject({
          content: [
            {
              type: 'text',
              text: expect.stringContaining('Firecrawl fallback success!'),
            },
          ],
        });
        expect(result.content[0].text).toContain('Scraped using: firecrawl');
      });

      it('should handle complete failure gracefully', async () => {
        client = await createTestMCPClientWithMocks(mode.serverPath, {
          nativeSuccess: false,
          enableFirecrawl: true,
          firecrawlSuccess: false,
        });

        const result = await client.callTool('scrape', {
          url: 'https://example.com',
          resultHandling: 'returnOnly',
        });

        expect(result).toMatchObject({
          content: [
            {
              type: 'text',
              text: expect.stringContaining('Failed to scrape'),
            },
          ],
          isError: true,
        });
      });

      it('should validate required url parameter', async () => {
        client = await createTestMCPClientWithMocks(mode.serverPath, {});

        const result = await client.callTool('scrape', {
          // Missing url parameter
          resultHandling: 'returnOnly',
        });

        // Tool should return error response, not throw
        expect(result).toMatchObject({
          content: [
            {
              type: 'text',
              text: expect.stringContaining('Required'),
            },
          ],
          isError: true,
        });
      });

      it('should handle maxChars parameter', async () => {
        const longContent = 'A'.repeat(1000);

        client = await createTestMCPClientWithMocks(mode.serverPath, {
          nativeSuccess: true,
          nativeData: longContent,
        });

        const result = await client.callTool('scrape', {
          url: 'https://example.com',
          maxChars: 100,
          resultHandling: 'returnOnly',
        });

        expect(result.content[0].text).toContain('[Content truncated at 100 characters');
      });
    });
  });
}
