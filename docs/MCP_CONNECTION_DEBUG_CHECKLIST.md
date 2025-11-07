# MCP Streamable HTTP Connection Debugging Checklist

**Quick reference for diagnosing connection issues with MCP Streamable HTTP servers**

---

## Symptom: 400 Bad Request on Initialize

### Check 1: Client Not Sending Session ID on First Request

```bash
# WRONG - Client sends Mcp-Session-Id on initialize
curl -X POST http://localhost:3000/mcp \
  -H "Mcp-Session-Id: some-id" \  # ❌ WRONG
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize",...}'

# RIGHT - No session ID on initialize
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \  # ✅ CORRECT
  -d '{"jsonrpc":"2.0","method":"initialize",...}'
```

### Check 2: Request Body is Valid Initialize Request

```typescript
// Verify with isInitializeRequest
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

console.log(isInitializeRequest(req.body)); // Should be true

// Valid initialize request:
{
  jsonrpc: '2.0',
  method: 'initialize',
  params: {
    protocolVersion: '2025-03-26',
    capabilities: {},
    clientInfo: {
      name: 'client-name',
      version: '1.0.0'
    }
  },
  id: 1
}
```

### Check 3: Server Route Handling

```typescript
// Ensure server checks both conditions
if (!sessionId && isInitializeRequest(req.body)) {
  // Create new session ✅
} else if (sessionId && transports[sessionId]) {
  // Use existing session ✅
} else {
  // Return 400 error ❌
}
```

---

## Symptom: 403 Forbidden

### Check 1: CORS Configuration

```typescript
// Add CORS middleware BEFORE MCP routes
import cors from 'cors';

app.use(cors({
  origin: '*', // Or specific origins
  exposedHeaders: ['Mcp-Session-Id'],
  allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Accept'],
}));

// Then MCP routes
app.post('/mcp', ...);
```

### Check 2: DNS Rebinding Protection

```typescript
// If enabled, must configure allowed hosts
const transport = new StreamableHTTPServerTransport({
  enableDnsRebindingProtection: process.env.NODE_ENV === 'production',

  // In production, whitelist your hosts
  allowedHosts:
    process.env.NODE_ENV === 'production' ? ['api.yourdomain.com'] : ['127.0.0.1', 'localhost'],

  allowedOrigins:
    process.env.NODE_ENV === 'production' ? ['https://app.yourdomain.com'] : undefined,
});
```

### Check 3: Accept Header

```typescript
// Client must include Accept header
fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream', // ✅ Required
  },
});
```

---

## Symptom: Session Not Found After Initialize

### Check 1: Session ID Extraction

```typescript
// SERVER: Log session ID when initialized
transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  onsessioninitialized: (sid) => {
    console.log('🔵 Session initialized:', sid);
    transports[sid] = transport; // ✅ Store immediately
    console.log('🔵 Stored in map:', Object.keys(transports));
  },
});
```

### Check 2: Client Stores Session ID

```typescript
// CLIENT: Extract and store session ID from response
const response = await fetch(url, { ... });
const sessionId = response.headers.get('Mcp-Session-Id');

console.log('🟢 Received session ID:', sessionId);

// Store for next requests
this.sessionId = sessionId;
```

### Check 3: Session ID Sent in Subsequent Requests

```typescript
// CLIENT: All requests after initialize must include session ID
fetch(url, {
  headers: {
    'Content-Type': 'application/json',
    'Mcp-Session-Id': this.sessionId, // ✅ Required
  },
});
```

### Check 4: Session Map Persistence

```typescript
// SERVER: Verify session still exists
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];

  console.log('🔵 Looking for session:', sessionId);
  console.log('🔵 Available sessions:', Object.keys(transports));

  if (sessionId && transports[sessionId]) {
    console.log('✅ Session found');
  } else {
    console.log('❌ Session not found');
  }
});
```

---

## Symptom: Responses Go to Wrong Clients

### Check: Using Shared Transport in Stateless Mode

```typescript
// WRONG - Sharing transport causes ID collisions
const sharedTransport = new StreamableHTTPServerTransport({ ... });

app.post('/mcp', async (req, res) => {
  await server.connect(sharedTransport); // ❌ BAD
  await sharedTransport.handleRequest(req, res, req.body);
});

// RIGHT - New transport per request
app.post('/mcp', async (req, res) => {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless
    enableJsonResponse: true,
  });

  res.on('close', () => transport.close()); // Cleanup

  await server.connect(transport); // ✅ GOOD
  await transport.handleRequest(req, res, req.body);
});
```

---

## Symptom: Memory Leaks / Growing Memory

### Check 1: Transport Cleanup on Close

```typescript
// Set onclose handler for cleanup
transport.onclose = () => {
  if (transport.sessionId) {
    console.log('🧹 Cleaning up session:', transport.sessionId);
    delete transports[transport.sessionId];
  }
};
```

### Check 2: Graceful Shutdown

```typescript
// Clean up all sessions on shutdown
process.on('SIGTERM', async () => {
  console.log('🧹 Cleaning up all sessions...');

  for (const sessionId in transports) {
    try {
      await transports[sessionId].close();
      delete transports[sessionId];
    } catch (error) {
      console.error('Error closing session:', sessionId, error);
    }
  }

  process.exit(0);
});
```

### Check 3: Session Timeouts

```typescript
// Implement session timeout (optional but recommended)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const sessionActivity: Record<string, number> = {};

// Update on each request
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string;

  if (sessionId) {
    sessionActivity[sessionId] = Date.now();
  }

  // ... handle request
});

// Periodic cleanup
setInterval(
  () => {
    const now = Date.now();

    for (const sessionId in sessionActivity) {
      if (now - sessionActivity[sessionId] > SESSION_TIMEOUT) {
        console.log('⏰ Session timeout:', sessionId);

        if (transports[sessionId]) {
          transports[sessionId].close();
          delete transports[sessionId];
        }

        delete sessionActivity[sessionId];
      }
    }
  },
  5 * 60 * 1000
); // Check every 5 minutes
```

---

## Diagnostic Logging

### Add Comprehensive Logging

```typescript
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const method = req.body?.method;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Incoming Request');
  console.log('   Method:', req.method);
  console.log('   MCP Method:', method);
  console.log('   Session ID:', sessionId || 'none');
  console.log('   Is Initialize:', isInitializeRequest(req.body));
  console.log('   Active Sessions:', Object.keys(transports).length);
  console.log('   Session IDs:', Object.keys(transports));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // ... handle request

  console.log('📤 Response sent');
  console.log('   Status:', res.statusCode);
  console.log('   Session ID Header:', res.getHeader('Mcp-Session-Id'));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
```

---

## Testing Tools

### 1. Manual Client for Testing

```typescript
// Save as test-client.ts
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
  name: 'test-client',
  version: '1.0.0',
});

const transport = new StreamableHTTPClientTransport(new URL('http://localhost:3000/mcp'));

console.log('🔌 Connecting...');
await client.connect(transport);
console.log('✅ Connected');

console.log('\n📋 Listing tools...');
const tools = await client.listTools();
console.log(
  'Tools:',
  tools.tools.map((t) => t.name)
);

console.log('\n🔨 Calling tool...');
const result = await client.callTool({
  name: 'echo',
  arguments: { message: 'test' },
});
console.log('Result:', result);

console.log('\n🔌 Disconnecting...');
await client.close();
console.log('✅ Disconnected');
```

### 2. curl Test Script

```bash
#!/bin/bash
# Save as test-server.sh

set -e  # Exit on error

BASE_URL="http://localhost:3000/mcp"

echo "🧪 Testing MCP Server"
echo "===================="

# 1. Initialize
echo -e "\n1️⃣  Initialize Session"
RESPONSE=$(curl -i -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    },
    "id": 1
  }')

# Extract session ID
SESSION_ID=$(echo "$RESPONSE" | grep -i "Mcp-Session-Id:" | awk '{print $2}' | tr -d '\r')

if [ -z "$SESSION_ID" ]; then
  echo "❌ Failed to get session ID"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Session ID: $SESSION_ID"

# 2. Send initialized notification
echo -e "\n2️⃣  Send Initialized Notification"
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc": "2.0", "method": "notifications/initialized"}' \
  > /dev/null

echo "✅ Notification sent"

# 3. List tools
echo -e "\n3️⃣  List Tools"
TOOLS=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{"jsonrpc": "2.0", "method": "tools/list", "id": 2}')

echo "$TOOLS" | jq -r '.result.tools[] | "  • \(.name): \(.description)"'

# 4. Call tool
echo -e "\n4️⃣  Call Tool"
RESULT=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: $SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {"message": "Hello!"}
    },
    "id": 3
  }')

echo "$RESULT" | jq '.result'

echo -e "\n✅ All tests passed!"
```

### 3. Integration Test

```typescript
// test/integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Application } from 'express';
import { createExpressServer } from '../server';

describe('MCP HTTP Integration', () => {
  let app: Application;
  let sessionId: string;

  beforeAll(async () => {
    app = await createExpressServer();
  });

  it('initializes session', async () => {
    const res = await request(app)
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

    sessionId = res.headers['mcp-session-id'];
    expect(sessionId).toBeDefined();
    expect(res.body).toHaveProperty('result');
  });

  it('sends initialized notification', async () => {
    await request(app)
      .post('/mcp')
      .set('Mcp-Session-Id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      })
      .expect(200);
  });

  it('lists tools', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Mcp-Session-Id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 2,
      })
      .expect(200);

    expect(res.body.result).toHaveProperty('tools');
    expect(Array.isArray(res.body.result.tools)).toBe(true);
  });

  it('calls tool', async () => {
    const res = await request(app)
      .post('/mcp')
      .set('Mcp-Session-Id', sessionId)
      .send({
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: 'echo',
          arguments: { message: 'test' },
        },
        id: 3,
      })
      .expect(200);

    expect(res.body.result).toHaveProperty('content');
  });

  it('rejects request without session', async () => {
    await request(app)
      .post('/mcp')
      .send({
        jsonrpc: '2.0',
        method: 'tools/list',
        id: 4,
      })
      .expect(400);
  });

  it('rejects initialize with session ID', async () => {
    await request(app)
      .post('/mcp')
      .set('Mcp-Session-Id', 'some-id')
      .send({
        jsonrpc: '2.0',
        method: 'initialize',
        params: {
          protocolVersion: '2025-03-26',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
        id: 5,
      })
      .expect(400);
  });
});
```

---

## Quick Verification Commands

```bash
# Check if server is running
curl http://localhost:3000/health

# Test initialize (no session ID)
curl -i -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'

# Check for Mcp-Session-Id header in response
# Should see: Mcp-Session-Id: <uuid>

# Test with session ID (replace <session-id>)
curl -i -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Mcp-Session-Id: <session-id>" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":2}'
```

---

## Common Environment Issues

### Port Already in Use

```bash
# Find process using port
lsof -i :3000
# Or
ss -tuln | grep 3000

# Kill process
kill -9 <PID>
```

### Environment Variables Not Loaded

```bash
# Verify .env is loaded
node -e "require('dotenv').config(); console.log(process.env.PORT)"

# Or use explicit path
node -r dotenv/config server.js
```

### TypeScript Compilation Errors

```bash
# Clean build
rm -rf dist/
npm run build

# Check for type errors
npx tsc --noEmit
```

---

## Summary Checklist

Use this checklist to systematically diagnose issues:

- [ ] Server is running and health endpoint responds
- [ ] CORS is configured before MCP routes
- [ ] Client does NOT send `Mcp-Session-Id` on initialize
- [ ] Client includes `Accept: application/json, text/event-stream` header
- [ ] Server uses `isInitializeRequest()` to validate first request
- [ ] Session ID is extracted from response header
- [ ] Session ID is sent in all subsequent requests
- [ ] Transport is stored in session map on `onsessioninitialized`
- [ ] Transport cleanup happens on `onclose`
- [ ] DNS rebinding protection is configured if enabled
- [ ] Logging shows session lifecycle events
- [ ] No shared transport instances in stateless mode
- [ ] Session timeouts are implemented (optional)
- [ ] Graceful shutdown closes all transports
