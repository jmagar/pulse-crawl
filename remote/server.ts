import express, { Application } from 'express';
import cors from 'cors';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createMCPServer } from './shared/index.js';
import { createTransport } from './transport.js';
import { healthCheck, getCorsOptions } from './middleware/index.js';
import { logInfo, logError } from './shared/utils/logging.js';

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

  // OAuth endpoints disabled - not yet implemented
  // TODO: Implement OAuth when MCP SDK provides authentication support

  // Transport storage: maps session IDs to their transports
  const transports: Record<string, StreamableHTTPServerTransport> = {};

  /**
   * Main MCP endpoint - handles all HTTP methods (GET, POST, DELETE)
   *
   * Request flow:
   * 1. Check for existing session ID in headers or query params (for GET)
   * 2. If session exists, reuse its transport
   * 3. If new initialization request, create transport and MCP server
   * 4. Otherwise, return error
   * 5. Handle request via transport
   *
   * Note: Session ID can come from:
   * - Mcp-Session-Id header (POST, DELETE requests)
   * - sessionId query parameter (GET requests for SSE)
   */
  app.all('/mcp', async (req, res) => {
    // Accept session ID from header or query param (for EventSource/GET requests)
    const sessionId =
      (req.headers['mcp-session-id'] as string | undefined) ||
      (req.method === 'GET' ? (req.query.sessionId as string | undefined) : undefined);

    if (sessionId) {
      logInfo('MCP', `${req.method} request for session`, { sessionId, method: req.method });
    } else {
      logInfo('MCP', `${req.method} request (no session)`, { method: req.method });
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
            logInfo('MCP', 'Session initialized', { sessionId: sid });
            transports[sid] = transport;
          },
          onSessionClosed: (sid) => {
            logInfo('MCP', 'Session closed', { sessionId: sid });
            delete transports[sid];
          },
        });

        // Set up onclose handler to clean up transport
        transport.onclose = () => {
          const sid = transport.sessionId;
          if (sid && transports[sid]) {
            logInfo('MCP', 'Transport closed for session', { sessionId: sid });
            delete transports[sid];
          }
        };

        // Create and connect MCP server
        const { server, registerHandlers } = createMCPServer();
        await registerHandlers(server);
        await server.connect(transport);

        logInfo('MCP', 'New server instance connected');
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

      // Copy query param session ID to header for SDK compatibility
      // The SDK's validateSession checks req.headers['mcp-session-id']
      if (sessionId && req.method === 'GET' && !req.headers['mcp-session-id']) {
        req.headers['mcp-session-id'] = sessionId;
      }

      // Handle the request with the transport
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      logError('MCP', error, { method: req.method, sessionId });
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
    logInfo('shutdown', 'Shutting down gracefully...');

    // Close all active transports
    const sessionIds = Object.keys(transports);
    for (const sessionId of sessionIds) {
      try {
        logInfo('shutdown', 'Closing transport for session', { sessionId });
        await transports[sessionId].close();
        delete transports[sessionId];
      } catch (error) {
        logError('shutdown', error, { sessionId });
      }
    }

    logInfo('shutdown', 'Shutdown complete');
    process.exit(0);
  };

  // Register shutdown handlers
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return app;
}
