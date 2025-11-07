# MCP Streamable HTTP Implementation Patterns

## Overview

This document provides working examples and patterns for implementing MCP Streamable HTTP servers and clients based on official SDK documentation and real-world implementations.

**Date**: 2025-11-06
**MCP Protocol Version**: 2025-03-26
**SDK Version**: @modelcontextprotocol/sdk

---

## Table of Contents

1. [Session Initialization Flow](#session-initialization-flow)
2. [Server Implementation Patterns](#server-implementation-patterns)
3. [Client Connection Patterns](#client-connection-patterns)
4. [Common Issues and Solutions](#common-issues-and-solutions)
5. [Testing Strategies](#testing-strategies)

---

## Session Initialization Flow

### Protocol Sequence

```
Client                          Server
  |                                |
  |-- POST /mcp ------------------>|  (1) InitializeRequest
  |    Accept: application/json,  |      No Mcp-Session-Id header
  |            text/event-stream   |      Body: { jsonrpc, method: "initialize", params }
  |                                |
  |<-- 200 OK --------------------|  (2) InitializeResponse
  |    Mcp-Session-Id: <uuid>     |      Body: { jsonrpc, result: { capabilities, ... } }
  |    Content-Type: application/  |
  |                   json         |
  |                                |
  |-- POST /mcp ------------------>|  (3) InitializedNotification
  |    Mcp-Session-Id: <uuid>     |      Body: { jsonrpc, method: "notifications/initialized" }
  |                                |
  |<-- 200 OK --------------------|  (4) Acknowledgment
  |                                |
  |                                |
  |-- POST /mcp ------------------>|  (5) Subsequent requests
  |    Mcp-Session-Id: <uuid>     |      Body: { jsonrpc, method: "tools/list", id: 1 }
  |                                |
  |<-- 200 OK --------------------|  (6) Tool response
  |    Content-Type: application/  |      Body: { jsonrpc, result: { tools: [...] }, id: 1 }
  |                   json         |
```

### Key Requirements

1. **Initial Request**: Must be an `initialize` request with `isInitializeRequest(req.body) === true`
2. **No Session ID**: First request MUST NOT include `Mcp-Session-Id` header
3. **Accept Header**: Client should include `Accept: application/json, text/event-stream`
4. **Session ID Response**: Server returns `Mcp-Session-Id` header in response
5. **Subsequent Requests**: All following requests MUST include the `Mcp-Session-Id` header

---

## Server Implementation Patterns

### Pattern 1: Stateful Server with Session Management (RECOMMENDED)

This is the most common pattern for production servers. Each session gets its own MCP server instance.

```typescript
import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

const app = express();
app.use(express.json());

// Map to store transports by session ID
const transports: Record<string, StreamableHTTPServerTransport> = {};

app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;

  try {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && transports[sessionId]) {
      // Existing session - reuse transport
      transport = transports[sessionId];
    } else if (!sessionId && isInitializeRequest(req.body)) {
      // New session - create transport
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sid) => {
          transports[sid] = transport;
          console.log('Session initialized:', sid);
        },
        enableJsonResponse: true,
      });

      // Cleanup on close
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          console.log('Session closed:', transport.sessionId);
        }
      };

      // Create MCP server and connect
      const server = new McpServer({
        name: 'my-server',
        version: '1.0.0',
      });

      // Register tools, resources, prompts here
      server.registerTool(
        'echo',
        {
          title: 'Echo Tool',
          description: 'Echoes back the message',
          inputSchema: { message: z.string() },
          outputSchema: { echo: z.string() },
        },
        async ({ message }) => ({
          content: [{ type: 'text', text: `Echo: ${message}` }],
          structuredContent: { echo: message },
        })
      );

      await server.connect(transport);
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID or not an initialization request',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('Error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: '2.0',
        error: { code: -32603, message: 'Internal server error' },
        id: null,
      });
    }
  }
});

// Handle GET for SSE (optional)
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

// Handle DELETE for session termination
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  if (!sessionId || !transports[sessionId]) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }

  const transport = transports[sessionId];
  await transport.handleRequest(req, res);
});

app.listen(3000, () => console.log('MCP server running on port 3000'));
```

### Pattern 2: Stateless Server (Simple APIs)

For simple proxies or stateless operations where session state is not needed.

```typescript
app.post('/mcp', async (req, res) => {
  // Create new transport for each request
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Disable sessions
    enableJsonResponse: true,
  });

  // Cleanup on response close
  res.on('close', () => {
    transport.close();
  });

  // Create server (can be reused across requests)
  const server = new McpServer({
    name: 'stateless-server',
    version: '1.0.0',
  });

  // Register handlers
  // ...

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

### Pattern 3: Persistent Storage Mode

For distributed deployments where sessions can resume on any node.

```typescript
import { randomUUID } from 'node:crypto';
import { InMemoryEventStore } from './eventStore.js';

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  eventStore: new InMemoryEventStore(), // Or database-backed store
  enableJsonResponse: true,
});
```

---

## Client Connection Patterns

### Pattern 1: Basic Client Connection

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
  name: 'my-client',
  version: '1.0.0',
});

// Connect to server
const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'));

await client.connect(transport);

// List tools
const tools = await client.listTools();
console.log(
  'Available tools:',
  tools.tools.map((t) => t.name)
);

// Call a tool
const result = await client.callTool({
  name: 'echo',
  arguments: { message: 'Hello, World!' },
});
console.log('Result:', result.content[0].text);

// Cleanup
await client.close();
```

### Pattern 2: Backwards Compatible Client

Attempts Streamable HTTP first, falls back to legacy SSE transport.

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

let client: Client | undefined;
const baseUrl = new URL('http://localhost:3000/mcp');

try {
  // Try modern Streamable HTTP
  client = new Client({
    name: 'my-client',
    version: '1.0.0',
  });

  const transport = new StreamableHTTPClientTransport(baseUrl);
  await client.connect(transport);
  console.log('Connected using Streamable HTTP');
} catch (error) {
  // Fall back to legacy SSE
  console.log('Falling back to SSE transport');

  client = new Client({
    name: 'my-client',
    version: '1.0.0',
  });

  const sseTransport = new SSEClientTransport(baseUrl);
  await client.connect(sseTransport);
  console.log('Connected using SSE');
}
```

### Pattern 3: Manual HTTP Client (Testing/Debugging)

For low-level testing without SDK client:

```typescript
interface McpRequest {
  jsonrpc: '2.0';
  method: string;
  params?: Record<string, unknown>;
  id?: number | string;
}

interface McpResponse {
  jsonrpc: '2.0';
  result?: unknown;
  error?: { code: number; message: string };
  id?: number | string;
}

class ManualMcpClient {
  private sessionId?: string;

  constructor(private baseUrl: string) {}

  async initialize() {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: {
            name: 'manual-client',
            version: '1.0.0',
          },
        },
        id: 1,
      }),
    });

    // Extract session ID from response header
    this.sessionId = response.headers.get('Mcp-Session-Id') || undefined;

    const data: McpResponse = await response.json();
    console.log('Initialize response:', data);

    // Send initialized notification
    await this.sendNotification('notifications/initialized');
  }

  async sendRequest(method: string, params?: Record<string, unknown>, id = 1) {
    if (!this.sessionId) throw new Error('Not initialized');

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': this.sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
        id,
      }),
    });

    return await response.json();
  }

  async sendNotification(method: string, params?: Record<string, unknown>) {
    if (!this.sessionId) throw new Error('Not initialized');

    await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Mcp-Session-Id': this.sessionId,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method,
        params,
      }),
    });
  }

  async listTools() {
    return await this.sendRequest('tools/list');
  }

  async callTool(name: string, args: Record<string, unknown>) {
    return await this.sendRequest('tools/call', {
      name,
      arguments: args,
    });
  }
}

// Usage
const client = new ManualMcpClient('http://localhost:3000/mcp');
await client.initialize();
const tools = await client.listTools();
console.log('Tools:', tools);
```

---

## Common Issues and Solutions

### Issue 1: 400 Bad Request on Initialize

**Symptoms**:

- First request returns 400
- Error: "No valid session ID provided"

**Cause**:

- Client sending session ID on first request
- Server expecting no session ID on initialize

**Solution**:

```typescript
// CLIENT: Don't send session ID on first request
const response = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // NO 'Mcp-Session-Id' header here!
  },
  body: JSON.stringify(initializeRequest),
});
```

### Issue 2: 403 Forbidden

**Symptoms**:

- Server rejects requests with 403
- May occur on all requests or only after initialize

**Causes & Solutions**:

1. **CORS Issue**:

```typescript
// SERVER: Enable CORS with proper headers
import cors from 'cors';

app.use(
  cors({
    origin: '*', // Or specific origins
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id'],
  })
);
```

2. **DNS Rebinding Protection**:

```typescript
// SERVER: Configure allowed hosts
const transport = new StreamableHTTPServerTransport({
  enableDnsRebindingProtection: true,
  allowedHosts: ['127.0.0.1', 'localhost'],
  allowedOrigins: ['http://localhost:3000'],
});
```

3. **Missing Accept Header**:

```typescript
// CLIENT: Include Accept header
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json, text/event-stream',
}
```

### Issue 3: Session Not Found After Initialize

**Symptoms**:

- Initialize succeeds
- Next request fails with "session not found"

**Cause**:

- Transport not stored in session map
- Session ID not being sent in subsequent requests

**Solution**:

```typescript
// SERVER: Ensure transport is stored
transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  onsessioninitialized: (sid) => {
    transports[sid] = transport; // CRITICAL: Store before handleRequest
    console.log('Stored transport for session:', sid);
  },
});

// CLIENT: Ensure session ID is sent
const sessionId = response.headers.get('Mcp-Session-Id');
// Store and use in all subsequent requests
headers: {
  'Mcp-Session-Id': sessionId,
}
```

### Issue 4: Request ID Collisions (Stateless Mode)

**Symptoms**:

- Responses go to wrong clients
- Random failures in concurrent requests

**Cause**:

- Sharing transport instance across requests
- Different clients using same JSON-RPC request IDs

**Solution**:

```typescript
// SERVER: Create new transport per request in stateless mode
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on('close', () => transport.close());

  // Fresh server connection per request
  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});
```

### Issue 5: Memory Leaks from Unclosed Transports

**Symptoms**:

- Memory usage grows over time
- Server slows down with many sessions

**Cause**:

- Transports not cleaned up when sessions end
- Missing onclose handlers

**Solution**:

```typescript
// SERVER: Clean up on close
transport.onclose = () => {
  if (transport.sessionId) {
    delete transports[transport.sessionId];
    console.log('Cleaned up session:', transport.sessionId);
  }
};

// Also handle graceful shutdown
process.on('SIGTERM', async () => {
  for (const sid in transports) {
    await transports[sid].close();
  }
  process.exit(0);
});
```

---

## Testing Strategies

### Unit Testing with Mock Transport

```typescript
import { describe, it, expect, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

describe('MCP Server', () => {
  it('handles initialize request', async () => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => 'test-session',
      enableJsonResponse: true,
    });

    const server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    await server.connect(transport);

    // Mock Express request/response
    const req = {
      headers: {},
      body: {
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
        id: 1,
      },
    };

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
      headersSent: false,
    };

    await transport.handleRequest(req as any, res as any, req.body);

    expect(res.setHeader).toHaveBeenCalledWith('Mcp-Session-Id', 'test-session');
    expect(res.json).toHaveBeenCalled();
  });
});
```

### Integration Testing with Real HTTP

```typescript
import request from 'supertest';
import { createExpressServer } from './server';

describe('MCP HTTP Server', () => {
  let app: Express.Application;
  let sessionId: string;

  beforeAll(async () => {
    app = await createExpressServer();
  });

  it('initializes a session', async () => {
    const response = await request(app)
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
        id: 1,
      })
      .expect(200);

    sessionId = response.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();
    expect(response.body).toHaveProperty('result');
  });

  it('lists tools with session', async () => {
    const response = await request(app)
      .post('/mcp')
      .set('Mcp-Session-Id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 2,
      })
      .expect(200);

    expect(response.body).toHaveProperty('result.tools');
  });
});
```

### Manual Testing with curl

```bash
#!/bin/bash

# 1. Initialize session
echo "=== Initialize Session ==="
INIT_RESPONSE=$(curl -i -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {
        "name": "curl-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }')

# Extract session ID from headers
SESSION_ID=$(echo "$INIT_RESPONSE" | grep -i "Mcp-Session-Id:" | awk '{print $2}' | tr -d '\r')
echo "Session ID: $SESSION_ID"

# 2. Send initialized notification
echo "=== Send Initialized Notification ==="
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "notifications/initialized"
  }'

# 3. List tools
echo "=== List Tools ==="
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }' | jq .

# 4. Call a tool
echo "=== Call Tool ==="
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "Hello from curl!"
      }
    },
    "id": 3
  }' | jq .
```

---

## CORS Configuration for Browser Clients

```typescript
import cors from 'cors';

app.use(
  cors({
    // Development: allow all origins
    origin: '*',

    // Production: whitelist specific origins
    // origin: ['https://app.example.com', 'https://admin.example.com'],

    // Expose custom headers to browser
    exposedHeaders: ['Mcp-Session-Id'],

    // Allow custom headers from browser
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Accept', 'Authorization'],

    // Allow credentials (cookies, auth headers)
    credentials: true,

    // Cache preflight response for 24 hours
    maxAge: 86400,
  })
);
```

---

## References

- [MCP Specification - Transports](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [invariantlabs-ai/mcp-streamable-http](https://github.com/invariantlabs-ai/mcp-streamable-http) - Example implementations
- [yigitkonur/example-mcp-server-streamable-http](https://github.com/yigitkonur/example-mcp-server-streamable-http) - Stateful architecture example

---

## Your Current Implementation Analysis

Your Pulse Fetch server implementation follows the recommended Pattern 1 (Stateful Server with Session Management) and appears correct. The key aspects are properly implemented:

1. ✅ Session storage with `transports` map
2. ✅ Proper `isInitializeRequest()` check
3. ✅ Session ID callbacks (`onsessioninitialized`, `onsessionclosed`)
4. ✅ Transport cleanup on close
5. ✅ Error handling for invalid requests
6. ✅ Support for GET (SSE) and DELETE methods
7. ✅ CORS configuration

**If you're experiencing 400/403 errors**, check:

- Client is NOT sending `Mcp-Session-Id` on first initialize request
- CORS headers are properly configured
- DNS rebinding protection settings in production
- Client includes proper `Accept` header
- Session ID is being extracted and stored correctly
