# Docstring Guidelines for Pulse Fetch

## Quick Reference

### JSDoc Format

````typescript
/**
 * Brief one-line description (imperative mood for functions)
 *
 * Detailed explanation providing context, use cases, and important
 * considerations. Can span multiple paragraphs as needed.
 *
 * @param paramName - Description of parameter and its purpose
 * @param optionalParam - Optional parameter with default behavior
 * @returns Description of return value and what it represents
 * @throws {ErrorType} When and why this error is thrown
 *
 * @example
 * ```typescript
 * const result = myFunction('input', { option: true });
 * if (result.success) {
 *   console.log(result.data);
 * }
 * ```
 */
````

## Common Patterns

### Factory Functions

````typescript
/**
 * Create a scraping client based on strategy configuration
 *
 * Analyzes the URL and configuration to determine the optimal
 * scraping strategy. Falls back to native fetch if no specialized
 * client is available.
 *
 * @param url - The URL to scrape
 * @param config - Scraping configuration options
 * @returns Configured scraping client instance
 * @throws {InvalidConfigError} When configuration is invalid
 *
 * @example
 * ```typescript
 * const client = createScrapingClient(
 *   'https://example.com',
 *   { strategy: 'firecrawl' }
 * );
 * const result = await client.scrape();
 * ```
 */
````

### Client Classes

````typescript
/**
 * HTTP transport implementation for MCP server
 *
 * Provides streamable HTTP transport with support for:
 * - Server-sent events (SSE) for real-time updates
 * - Resumable connections with event replay
 * - CORS and authentication middleware
 *
 * @example
 * ```typescript
 * const server = new MCPServer();
 * const transport = new HTTPTransport(server, {
 *   port: 3060,
 *   enableResumability: true
 * });
 * await transport.start();
 * ```
 */
export class HTTPTransport {
  /**
   * Create HTTP transport instance
   *
   * @param server - MCP server instance to wrap
   * @param options - Transport configuration options
   */
  constructor(server: Server, options: TransportOptions) {}

  /**
   * Start the HTTP server and begin accepting connections
   *
   * @returns Promise that resolves when server is listening
   * @throws {PortInUseError} When the specified port is unavailable
   */
  async start(): Promise<void> {}
}
````

### Configuration Objects

```typescript
/**
 * Configuration options for scraping operations
 *
 * Defines how content should be fetched, processed, and stored.
 * All options have sensible defaults and can be overridden per-request.
 */
export interface ScrapeOptions {
  /** URL to scrape (required) */
  url: string;

  /**
   * Strategy to use for scraping
   * - 'auto': Automatically select based on URL and config
   * - 'native': Use built-in fetch with no special handling
   * - 'firecrawl': Use Firecrawl API for enhanced extraction
   * @default 'auto'
   */
  strategy?: 'auto' | 'native' | 'firecrawl';

  /**
   * Natural language query to extract specific information
   * Only available when LLM provider is configured
   * @example "Extract the product price and specifications"
   */
  extract?: string;

  /**
   * Whether to clean/convert HTML to markdown
   * @default true
   */
  cleanContent?: boolean;
}
```

### Error Handling Utilities

````typescript
/**
 * Custom error for invalid configuration
 *
 * Thrown when configuration validation fails or when
 * required configuration values are missing.
 *
 * @example
 * ```typescript
 * if (!config.apiKey) {
 *   throw new InvalidConfigError('API key is required');
 * }
 * ```
 */
export class InvalidConfigError extends Error {}
````

## Review Checklist

- [ ] All public exports documented
- [ ] Parameters and returns described
- [ ] Complex functions have examples
- [ ] Error conditions noted with `@throws`
- [ ] Descriptions use imperative mood for functions
- [ ] No placeholder text (e.g., "TODO")
- [ ] No copy-paste errors in descriptions
- [ ] Parameter names match actual code
- [ ] No typos or grammar errors

## What Requires Documentation

**Required** (counts toward coverage):

- ✅ Exported functions
- ✅ Exported classes and their public methods
- ✅ Exported interfaces and their properties
- ✅ Exported types
- ✅ Exported enums
- ✅ Module-level overview (via `@fileoverview`)

**Optional** (doesn't count toward coverage):

- Private/internal functions
- Test files
- Type-only imports
- Re-exports

## Module Documentation

```typescript
/**
 * @fileoverview MCP tool registration and server setup
 *
 * This module provides functions to register MCP tools and resources
 * with an MCP server instance. It handles the wiring between the
 * shared business logic and the MCP protocol.
 *
 * @module shared/mcp/registration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
// ... rest of file
```
