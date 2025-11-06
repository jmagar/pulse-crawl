import express, { Application } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMCPServer } from './shared/index.js';
import { createTransport } from './transport.js';
import { healthCheck, getCorsOptions } from './middleware/index.js';

/**
 * Creates and configures an Express server for HTTP streaming MCP transport
 *
 * The server provides:
 * - /mcp endpoint: Main MCP endpoint (handles GET, POST, DELETE)
 * - /health endpoint: Health check endpoint
 *
 * @returns Configured Express application
 */
export async function createExpressServer(): Promise<Application> {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(cors(getCorsOptions()));

  // Health check endpoint
  app.get('/health', healthCheck);

  // Transport storage: maps session IDs to their transports
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  /**
   * Main MCP endpoint - handles all HTTP methods (GET, POST, DELETE)
   *
   * Request flow:
   * 1. Check for existing session ID in headers
   * 2. If session exists, reuse its transport
   * 3. If new initialization request, create transport and MCP server
   * 4. Otherwise, return error
   * 5. Handle request via transport
   */
  app.all('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId) {
      console.error(`[MCP] ${req.method} request for session: ${sessionId}`);
    } else {
      console.error(`[MCP] ${req.method} request (no session)`);
    }

    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        // Reuse existing transport for this session
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        // New initialization request - create transport and server
        transport = createTransport({
          enableResumability: process.env.ENABLE_RESUMABILITY === 'true',
          onSessionInitialized: (sid) => {
            console.error(`[MCP] Session initialized: ${sid}`);
            transports[sid] = transport;
          },
          onSessionClosed: (sid) => {
            console.error(`[MCP] Session closed: ${sid}`);
            delete transports[sid];
          },
        });

        // Set up onclose handler to clean up transport
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            console.error(`[MCP] Transport closed for session ${sid}`);
            delete transports[sid];
          }
        };

        // Create and connect MCP server
        const { server, registerHandlers } = createMCPServer();
        await registerHandlers(server);
        await server.connect(transport);

        console.error('[MCP] New server instance connected');
      } else {
        // Invalid request - no session ID or not initialization request
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided or not an initialization request',
          },
          id: null,
        });
        return;
      }

      // Handle the request with the transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error('[MCP] Error handling request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // Graceful shutdown handler
  const shutdown = async () => {
    console.error('\n[Server] Shutting down gracefully...');

    // Close all active transports
    const sessionIds = Object.keys(transports);
    for (const sessionId of sessionIds) {
      try {
        console.error(`[Server] Closing transport for session ${sessionId}`);
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        console.error(`[Server] Error closing transport for session ${sessionId}:`, error);
      }
    }

    console.error('[Server] Shutdown complete');
    process.exit(0);
  };

  // Register shutdown handlers
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return app;
}
