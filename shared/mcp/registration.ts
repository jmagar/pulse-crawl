import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import type { ClientFactory, StrategyConfigFactory } from '../server.js';
import { scrapeTool } from './tools/scrape/index.js';
import { ResourceStorageFactory } from '../storage/index.js';

/**
 * Register MCP tools with the server
 */
export function registerTools(
  server: Server,
  clientFactory: ClientFactory,
  strategyConfigFactory: StrategyConfigFactory
): void {
  // Create tool instances
  const tools = [scrapeTool(server, clientFactory, strategyConfigFactory)];

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
    return (await tool.handler(args)) as any;
  });
}

/**
 * Register MCP resources with the server
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
