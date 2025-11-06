# Pulse Fetch OAuth & Authentication Exploration Report

Generated: 2025-11-06
Directory: /home/jmagar/code/pulse-fetch

---

## Executive Summary

**Status**: OAuth is NOT currently implemented. The remote HTTP server has a placeholder authentication middleware with no authentication logic.

The pulse-fetch project currently supports API key-based authentication for external services (Firecrawl, Anthropic, OpenAI) via environment variables. The HTTP remote transport layer has basic CORS and DNS rebinding protection but no client authentication mechanism.

---

## Current Architecture

### Three-Layer Architecture

```
1. shared/          - Core business logic (shared between local & remote)
2. local/           - Stdio transport (Claude Desktop integration)
3. remote/          - StreamableHTTP transport (HTTP POST with JSON + optional SSE)
```

### Remote Directory Structure

```
remote/
├── src/
│   ├── index.ts              # Entry point with environment validation
│   ├── server.ts             # Express server with MCP endpoint
│   ├── transport.ts          # StreamableHTTPServerTransport factory
│   ├── eventStore.ts         # In-memory event storage for resumability
│   └── middleware/
│       ├── auth.ts           # PLACEHOLDER - no-op passthrough
│       ├── cors.ts           # CORS configuration
│       └── health.ts         # Health check endpoint
├── build/                    # Compiled JavaScript + source maps
├── package.json              # Dependencies and scripts
└── README.md                 # Documentation
```

---

## Authentication Status

### Current State: PLACEHOLDER ONLY

**File**: `/home/jmagar/code/pulse-fetch/remote/src/middleware/auth.ts`

```typescript
/**
 * Placeholder for future authentication middleware
 * Currently a no-op passthrough
 *
 * Future implementation could use:
 * - Bearer token validation
 * - OAuth 2.0 with MCP SDK auth helpers
 * - API key checking
 * - JWT verification
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement authentication logic
  next();
}
```

**Key Points**:

- The middleware is imported into `server.ts` but NOT registered in the Express app
- No authentication checks are performed on any endpoint
- All requests bypass authentication entirely

---

## Environment Variable Configuration

### Location: `.env.example`

#### API Key Variables (External Services)

These authenticate Pulse Fetch to third-party services, NOT client authentication:

```bash
# Web Content Extraction
FIRECRAWL_API_KEY=your-firecrawl-api-key-here
FIRECRAWL_API_BASE_URL=https://api.firecrawl.dev  # Optional custom base URL

# LLM Extraction (Anthropic)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
# Also available: LLM_API_KEY (generic), LLM_API_BASE_URL (for OpenAI-compatible)

# LLM Extraction (OpenAI)
OPENAI_API_KEY=your-openai-api-key-here
LLM_API_BASE_URL=https://api.together.xyz/v1  # For OpenAI-compatible providers
```

#### Server Configuration Variables

```bash
# Server
PORT=3060
NODE_ENV=production

# CORS Security
ALLOWED_ORIGINS=https://your-app.com,https://another-app.com
ALLOWED_HOSTS=your-server.com

# Session Management
ENABLE_RESUMABILITY=true  # Allows client reconnection with event replay

# DNS Rebinding Protection
# Automatically enabled in production (NODE_ENV=production)
# Uses ALLOWED_ORIGINS and ALLOWED_HOSTS for validation

# Resource Storage
MCP_RESOURCE_STORAGE=memory  # or 'filesystem'
MCP_RESOURCE_FILESYSTEM_ROOT=/path/to/storage

# Strategy Configuration
PULSE_FETCH_STRATEGY_CONFIG_PATH=/path/to/strategies.md
OPTIMIZE_FOR=cost  # or 'speed'

# Health Checks
SKIP_HEALTH_CHECKS=false  # Validates API key availability at startup
```

---

## Server Implementation Details

### 1. Entry Point: `remote/src/index.ts`

**Initialization Flow**:

1. Load environment variables with `dotenv.config()`
2. Validate environment (checks OPTIMIZE_FOR value)
3. Log available services based on environment variables
4. Run health checks to validate API key accessibility
5. Create and start Express server

**Health Check** (lines 48-67):

```typescript
if (process.env.SKIP_HEALTH_CHECKS !== 'true') {
  console.error('Running authentication health checks...');
  const healthResults = await runHealthChecks();

  const failedChecks = healthResults.filter((result: any) => !result.success);
  if (failedChecks.length > 0) {
    console.error('\nAuthentication health check failures:');
    failedChecks.forEach(({ service, error }: { service: string; error?: string }) => {
      console.error(`  ${service}: ${error}`);
    });
    process.exit(1);
  }
}
```

**Available Services Logging** (lines 22-31):

```typescript
const available: string[] = [];
if (process.env.FIRECRAWL_API_KEY) available.push('Firecrawl');
if (process.env.ANTHROPIC_API_KEY) available.push('Anthropic');
if (process.env.OPENAI_API_KEY) available.push('OpenAI');

console.error(
  `Pulse Fetch HTTP Server starting with services: native${
    available.length > 0 ? ', ' + available.join(', ') : ''
  }`
);
```

### 2. Express Server: `remote/src/server.ts`

**Endpoints**:

- `POST /mcp` - Main MCP endpoint (handles JSON-RPC requests, returns JSON responses)
- `GET /mcp` - Optional SSE stream for server-initiated messages
- `DELETE /mcp` - Terminate session
- `GET /health` - Health check

**Request Flow** (lines 41-113):

1. Check for `mcp-session-id` header
2. If session exists, reuse transport
3. If new initialization request, create transport and MCP server
4. Otherwise, return error
5. Handle request via transport

**No authentication middleware is registered**:

```typescript
// Middleware
app.use(express.json());
app.use(cors(getCorsOptions()));
// NOTE: authMiddleware is NOT used anywhere

// Health check endpoint
app.get('/health', healthCheck);
```

### 3. Transport Factory: `remote/src/transport.ts`

**Features**:

- Cryptographically secure session IDs using `randomUUID()`
- Optional resumability using event store
- DNS rebinding protection (production only)
- Session lifecycle callbacks

**Configuration**:

```typescript
return new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  eventStore: enableResumability ? new InMemoryEventStore() : undefined,
  onsessioninitialized: onSessionInitialized,
  onsessionclosed: onSessionClosed,
  enableDnsRebindingProtection: process.env.NODE_ENV === 'production',
  allowedHosts: process.env.ALLOWED_HOSTS?.split(',').filter(Boolean),
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean),
});
```

### 4. CORS Middleware: `remote/src/middleware/cors.ts`

```typescript
export function getCorsOptions(): CorsOptions {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || ['*'];

  return {
    origin: allowedOrigins,
    exposedHeaders: ['Mcp-Session-Id'],
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  };
}
```

**Security Notes**:

- Defaults to `['*']` (allow all origins) if ALLOWED_ORIGINS not set
- In production, should always configure ALLOWED_ORIGINS

### 5. Health Check Endpoint: `remote/src/middleware/health.ts`

```typescript
export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || 'unknown',
    transport: 'http-streaming',
  });
}
```

---

## Session Management

### Session ID Generation

**Implementation**: `remote/src/transport.ts` (line 51)

```typescript
sessionIdGenerator: () => randomUUID();
```

- Uses Node.js `crypto.randomUUID()` - cryptographically secure
- Format: UUID v4 (36 characters)
- Generated per session, not per user
- No persistent session storage (in-memory only)

### Session Storage

**Type**: In-memory map in Express server
**Location**: `remote/src/server.ts` (line 29)

```typescript
const transports: Record<string, StreamableHTTPServerTransport> = {};
```

**Lifecycle**:

- Created on initialization request
- Stored in memory during server uptime
- Deleted on session close or server restart
- Lost on process termination

### Resumability (Optional)

**Enabling**: `ENABLE_RESUMABILITY=true`

**Implementation**: `remote/src/eventStore.ts`

- InMemoryEventStore implements MCP EventStore interface
- Stores events in Map with generated event IDs
- Client provides `Last-Event-ID` header to resume
- Events replayed in order after last known event

**Production Limitation**:

- Currently in-memory only
- Not suitable for multi-instance deployments
- Would need Redis, PostgreSQL, or DynamoDB for production

---

## MCP Protocol Compliance

### Protocol Version

- **Version**: 2025-03-26
- **Transport**: StreamableHTTPServerTransport
- **Primary Mode**: HTTP POST with JSON responses
- **Optional Streaming**: Server-Sent Events (SSE) for server-initiated messages

### Request/Response Format

**Initialization Request** (from README):

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-03-26",
    "clientInfo": {
      "name": "my-client",
      "version": "1.0.0"
    }
  }
}
```

**MCP Headers**:

- `Mcp-Session-Id`: Session identifier (required for existing sessions)
- `Last-Event-ID`: For resumability (optional)

---

## Testing Infrastructure

### Test Files

**Location**: `/home/jmagar/code/pulse-fetch/tests/remote/`

1. **middleware.test.ts** - Tests for health, CORS, auth middleware
   - Tests that authMiddleware is a no-op passthrough
   - Tests CORS configuration parsing
   - Tests health check response format

2. **transport.test.ts** - Tests for session transport
3. **http-server.integration.test.ts** - Integration tests
4. **eventStore.test.ts** - Event store functionality

### Auth Middleware Test

From `/home/jmagar/code/pulse-fetch/tests/remote/middleware.test.ts`:

```typescript
describe('authMiddleware', () => {
  it('should call next() without authentication (placeholder)', () => {
    const req = {} as Request;
    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith();
  });

  it('should not modify request or response (placeholder)', () => {
    const req = { test: 'value' } as any;
    const res = { test: 'value' } as any;
    const next = vi.fn() as NextFunction;

    authMiddleware(req, res, next);

    expect(req.test).toBe('value');
    expect(res.test).toBe('value');
  });
});
```

---

## Dependencies

### Key Authentication-Related Packages

**Currently Available** (from `remote/package.json`):

- `express@5.0.0` - Web framework
- `cors@2.8.17` - CORS middleware
- `dotenv@16.4.5` - Environment variable loading
- `@modelcontextprotocol/sdk@1.19.1` - MCP SDK

**NOT Currently Used**:

- No JWT libraries
- No OAuth libraries
- No authentication middlewares
- No API key validation libraries

### Available for Implementation

The following popular packages are NOT in dependencies but could be added:

- `jsonwebtoken` - JWT token handling
- `passport` - Authentication middleware
- `passport-oauth2` - OAuth 2.0 strategy
- `express-jwt` - JWT middleware for Express
- `rate-limit` - Rate limiting
- `helmet` - Security headers
- `bcrypt` - Password hashing (if needed)

---

## Security Configuration

### DNS Rebinding Protection

**Automatic in Production** (NODE_ENV === 'production'):

```typescript
enableDnsRebindingProtection: process.env.NODE_ENV === 'production',
allowedHosts: process.env.ALLOWED_HOSTS?.split(',').filter(Boolean),
allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean),
```

**What It Does**:

- Validates Host header against ALLOWED_HOSTS
- Validates Origin header against ALLOWED_ORIGINS
- Prevents DNS rebinding attacks

### Production Checklist (from README)

```
- [ ] Set NODE_ENV=production
- [ ] Configure ALLOWED_ORIGINS to specific domains (not *)
- [ ] Configure ALLOWED_HOSTS to your server's domain
- [ ] Use HTTPS (terminate SSL at reverse proxy/load balancer)
- [ ] Implement authentication middleware in middleware/auth.ts
- [ ] Use environment-specific API keys
- [ ] Enable rate limiting at reverse proxy level
- [ ] Monitor logs and health endpoint
- [ ] Implement persistent event store for resumability
```

**Item 5 explicitly flags the auth middleware as a TODO**.

---

## File Locations Summary

### Core Files

| File            | Path                              | Purpose                         |
| --------------- | --------------------------------- | ------------------------------- |
| Auth Middleware | `remote/src/middleware/auth.ts`   | Placeholder (no-op)             |
| CORS Config     | `remote/src/middleware/cors.ts`   | CORS configuration              |
| Health Check    | `remote/src/middleware/health.ts` | Health endpoint                 |
| Express Server  | `remote/src/server.ts`            | MCP endpoint routing            |
| Transport       | `remote/src/transport.ts`         | Session & transport config      |
| Event Store     | `remote/src/eventStore.ts`        | Event replay storage            |
| Entry Point     | `remote/src/index.ts`             | Server startup & env validation |
| Package Config  | `remote/package.json`             | Dependencies and scripts        |

### Configuration Files

| File         | Path            | Purpose                   |
| ------------ | --------------- | ------------------------- |
| Env Template | `.env.example`  | All environment variables |
| Build Output | `remote/build/` | Compiled JavaScript       |

### Test Files

| File              | Path                                           | Purpose                |
| ----------------- | ---------------------------------------------- | ---------------------- |
| Middleware Tests  | `tests/remote/middleware.test.ts`              | Auth/CORS/health tests |
| Transport Tests   | `tests/remote/transport.test.ts`               | Session management     |
| Integration Tests | `tests/remote/http-server.integration.test.ts` | Full server tests      |

---

## Environment Variables Checklist

### Currently Used

- `FIRECRAWL_API_KEY` - External service auth
- `ANTHROPIC_API_KEY` - External service auth
- `OPENAI_API_KEY` - External service auth
- `PORT` - Server port
- `NODE_ENV` - Environment mode
- `ALLOWED_ORIGINS` - CORS/DNS protection
- `ALLOWED_HOSTS` - DNS protection
- `ENABLE_RESUMABILITY` - Session resumability
- `SKIP_HEALTH_CHECKS` - Skip startup health checks

### NOT Currently Used

- No OAuth-related variables
- No API key validation token
- No JWT secret
- No rate limiting config
- No authentication mechanism config

---

## How the Server Currently Works

### Request Flow (No Authentication)

```
1. Client sends HTTP request to /mcp endpoint
2. Server checks for mcp-session-id header
   - If present: reuse existing transport
   - If not present & initialization request: create new transport
   - Otherwise: return error
3. Auth middleware: SKIPPED (not registered)
4. CORS check: Applied
5. Handle request with transport
6. Return response
```

### Security Layers Currently in Place

1. **CORS** - Configurable origin whitelist (defaults to allow all)
2. **DNS Rebinding Protection** - In production only
3. **Session IDs** - Cryptographically random UUIDs
4. **Health Checks** - Validates API key availability at startup

### Security Gaps

1. **No client authentication** - Any client can make requests
2. **No rate limiting** - No protection against abuse
3. **No request signing** - Requests not validated
4. **No API key validation** - No per-request authentication
5. **No HTTPS enforcement** - Must be done at reverse proxy
6. **No request logging** - Limited audit trail

---

## Next Steps for OAuth Implementation

### Recommended Approach

Based on the codebase structure and the explicit TODO in the production checklist, here's what would be needed:

1. **Define Authentication Strategy**
   - OAuth 2.0 (recommended for remote access)
   - API keys (simpler, already used for external services)
   - JWT tokens (stateless, scalable)
   - Hybrid approach (multiple methods)

2. **Update Environment Variables**

   ```bash
   # OAuth 2.0 Configuration
   OAUTH_PROVIDER=google|github|custom
   OAUTH_CLIENT_ID=your-client-id
   OAUTH_CLIENT_SECRET=your-client-secret
   OAUTH_CALLBACK_URL=https://your-server.com/callback

   # Or API Key Configuration
   MCP_API_KEY=your-api-key-hash

   # Or JWT Configuration
   JWT_SECRET=your-jwt-secret
   ```

3. **Implement Auth Middleware**
   - Update `remote/src/middleware/auth.ts`
   - Add validation logic
   - Handle errors gracefully

4. **Add Tests**
   - Update `tests/remote/middleware.test.ts`
   - Add authentication failure cases
   - Add authorization tests

5. **Update Documentation**
   - Update `remote/README.md`
   - Update `.env.example` with new variables
   - Add security section

6. **Add Dependencies** (if needed)
   - `jsonwebtoken` for JWT
   - `passport` for OAuth
   - `rate-limit` for rate limiting

---

## Conclusion

**Current Status**: OAuth/authentication is NOT implemented. The remote HTTP transport layer has:

- A placeholder, non-functional auth middleware
- CORS and DNS rebinding protection
- Secure session ID generation
- Health checks for external API keys

**What's Missing**: Any actual authentication mechanism to validate client requests.

**Recommendation**: Define an authentication strategy (OAuth 2.0, JWT, or API keys) and implement it in the auth middleware before deploying to production.
