/**
 * @fileoverview MCP tool and resource registration
 *
 * This module provides functions to register MCP tools and resources
 * with an MCP server instance. It handles the wiring between the
 * shared business logic and the MCP protocol by setting up request
 * handlers for tool execution and resource access.
 *
 * @module shared/mcp/registration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ClientFactory, StrategyConfigFactory } from '../server.js';
import { scrapeTool } from './tools/scrape/index.js';
import { createSearchTool } from './tools/search/index.js';
import { createMapTool } from './tools/map/index.js';
import { createCrawlTool } from './tools/crawl/index.js';
import { ResourceStorageFactory } from '../storage/index.js';
import type { FirecrawlConfig } from '../types.js';

/**
 * Register MCP tools with the server
 *
 * Sets up request handlers for tool listing and execution. Creates tool
 * instances with their dependencies and registers them with the MCP server
 * to handle ListTools and CallTool requests.
 *
 * @param server - MCP server instance to register tools with
 * @param clientFactory - Factory function for creating scraping clients
 * @param strategyConfigFactory - Factory for loading/saving learned strategies
 *
 * @example
 * ```typescript
 * const server = new Server({ name: 'pulse-fetch', version: '1.0.0' }, {});
 * registerTools(server, () => createClients(), strategyFactory);
 * // Server now handles tool requests
 * ```
 */
export function registerTools(
  server: Server,
  clientFactory: ClientFactory,
  strategyConfigFactory: StrategyConfigFactory
): void {
  // Create Firecrawl config from environment
  const firecrawlConfig: FirecrawlConfig = {
    apiKey: process.env.FIRECRAWL_API_KEY || '',
    baseUrl: process.env.FIRECRAWL_BASE_URL || 'https://api.firecrawl.dev/v2',
  };

  // Create tool instances
  const tools = [
    scrapeTool(server, clientFactory, strategyConfigFactory),
    createSearchTool(firecrawlConfig),
    createMapTool(firecrawlConfig),
    createCrawlTool(firecrawlConfig),
  ];

  // Register tool definitions
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }));

  // Register tool handlers
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    // Cast to any to satisfy MCP SDK type expectations
    // The ToolResponse interface matches the CallToolResult schema
    return (await (tool.handler as any)(args)) as any;
  });
}

/**
 * Register MCP resources with the server
 *
 * Sets up request handlers for resource listing and reading. Integrates
 * with the resource storage system to expose scraped content as MCP
 * resources that can be accessed via ListResources and ReadResource requests.
 *
 * @param server - MCP server instance to register resources with
 *
 * @example
 * ```typescript
 * const server = new Server({ name: 'pulse-fetch', version: '1.0.0' }, {});
 * registerResources(server);
 * // Server now handles resource requests
 * ```
 */
export function registerResources(server: Server): void {
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    const storage = await ResourceStorageFactory.create();
    const resources = await storage.list();

    return {
      resources: resources.map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        mimeType: resource.mimeType,
        description: resource.description,
      })),
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const storage = await ResourceStorageFactory.create();
    const { uri } = request.params;
    const resource = await storage.read(uri);

    return {
      contents: [
        {
          uri: resource.uri,
          mimeType: resource.mimeType,
          text: resource.text,
        },
      ],
    };
  });
}
