# Pulse Fetch OAuth & Authentication - Quick Reference

## Key Findings

**Status**: OAuth is NOT implemented

- Auth middleware exists but is a non-functional placeholder
- No client authentication mechanism
- No API key validation
- No rate limiting

## Core Files to Know

| File                            | Status          | Purpose                                    |
| ------------------------------- | --------------- | ------------------------------------------ |
| `remote/src/middleware/auth.ts` | PLACEHOLDER     | Client authentication (TODO)               |
| `remote/src/server.ts`          | IMPLEMENTED     | Express server - NOT using auth middleware |
| `remote/src/transport.ts`       | IMPLEMENTED     | Session management with secure UUIDs       |
| `remote/src/index.ts`           | IMPLEMENTED     | Server startup & environment validation    |
| `remote/src/middleware/cors.ts` | IMPLEMENTED     | CORS configuration                         |
| `.env.example`                  | CONFIG TEMPLATE | All environment variables                  |

## Environment Variables - Authentication Related

### Current (External Service Auth Only)

```bash
FIRECRAWL_API_KEY=...         # Firecrawl service
ANTHROPIC_API_KEY=...         # Anthropic service
OPENAI_API_KEY=...            # OpenAI service
```

### Server Configuration

```bash
PORT=3060                      # Server port
NODE_ENV=production            # Enables DNS rebinding protection
ALLOWED_ORIGINS=...            # CORS whitelist (comma-separated)
ALLOWED_HOSTS=...              # DNS protection whitelist
ENABLE_RESUMABILITY=true       # Session resumability
SKIP_HEALTH_CHECKS=false       # Skip startup health checks
```

### NOT Implemented Yet

```bash
# OAuth - No configuration
# JWT - No secret
# API Key validation - No mechanism
# Rate limiting - No config
```

## Current Security Implementation

### What Works ✓

- CORS with configurable origin whitelist
- DNS rebinding protection (production only)
- Secure session ID generation (UUID v4)
- Health checks for external API keys

### What's Missing ✗

- Client authentication
- Request validation
- Rate limiting
- Per-request API key checking
- HTTPS enforcement (must be reverse proxy)
- Audit logging

## Architecture Overview

```
Client → [No Auth Check] → Express Server → MCP Transport → External APIs
                           (CORS only)      (Session IDs)   (API Key Auth)
```

## MCP Endpoints

| Endpoint  | Method | Purpose                            | Auth  | Status |
| --------- | ------ | ---------------------------------- | ----- | ------ |
| `/mcp`    | POST   | JSON-RPC requests (primary mode)   | ❌ NO | Active |
| `/mcp`    | GET    | SSE stream (optional, server push) | ❌ NO | Active |
| `/mcp`    | DELETE | Close session                      | ❌ NO | Active |
| `/health` | GET    | Health check                       | ❌ NO | Active |

## Session Management

- **Session ID**: UUID v4 (36 characters)
- **Storage**: In-memory (lost on restart)
- **Header**: `Mcp-Session-Id`
- **Generated per**: Request (not per user)
- **Lifecycle**: Created on init, deleted on close or restart

## Request Flow (Current)

```
1. Client sends POST /mcp
2. Server checks for mcp-session-id header
3. ❌ Auth middleware: SKIPPED (not registered)
4. ✓ CORS check: Applied
5. Handle request with transport
6. Return response
```

## Request Flow (With Auth - Proposed)

```
1. Client sends POST /mcp with Authorization header
2. Server validates Authorization header
3. ✓ Auth middleware: Verify token/key
4. ✓ CORS check: Applied
5. Handle request with transport
6. Return response
```

## Dependencies

### Already Available

- `express@5.0.0`
- `cors@2.8.17`
- `dotenv@16.4.5`
- `@modelcontextprotocol/sdk@1.19.1`

### Missing (Would Need to Add)

- `jsonwebtoken` (JWT)
- `passport` (Auth middleware)
- `passport-oauth2` (OAuth)
- `express-rate-limit` (Rate limiting)
- `helmet` (Security headers)

## Production Checklist Status

From `remote/README.md`:

```
[✓] Set NODE_ENV=production
[✓] Configure ALLOWED_ORIGINS
[✓] Configure ALLOWED_HOSTS
[✗] Use HTTPS (needs reverse proxy)
[ ] Implement authentication middleware  ← TODO: Item #5
[✓] Use environment-specific API keys
[ ] Enable rate limiting                 ← TODO
[ ] Monitor logs and health endpoint
[ ] Implement persistent event store     ← TODO
```

## Test Coverage

### Current Tests

- `tests/remote/middleware.test.ts` - Tests that auth is no-op
- `tests/remote/transport.test.ts` - Session management
- `tests/remote/http-server.integration.test.ts` - Full server

### Missing Tests

- Successful authentication
- Failed authentication
- Invalid tokens/keys
- Rate limiting
- Authorization checks

## Implementation Approaches

### Option 1: OAuth 2.0 (Recommended)

- Pros: Industry standard, secure, delegated auth
- Cons: More complex, requires OAuth provider
- Files to update: `middleware/auth.ts`, `server.ts`, add OAuth routes

### Option 2: JWT Tokens

- Pros: Stateless, scalable, simple
- Cons: Need JWT_SECRET in env, token management
- Files to update: `middleware/auth.ts`

### Option 3: API Keys

- Pros: Simple, already used pattern
- Cons: Less secure than OAuth, key rotation needed
- Files to update: `middleware/auth.ts`

### Option 4: Hybrid (Recommended)

- Both JWT and API keys depending on use case
- More flexible and secure
- Files to update: `middleware/auth.ts`, `server.ts`

## Next Steps

1. **Define Strategy**: Choose authentication method
2. **Add Env Vars**: Update `.env.example`
3. **Implement Middleware**: Update `remote/src/middleware/auth.ts`
4. **Register Middleware**: Update `remote/src/server.ts`
5. **Add Tests**: Update test files
6. **Update Docs**: README.md, deployment guide

## File Locations Summary

```
/home/jmagar/code/pulse-fetch/
├── remote/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.ts                    ← PLACEHOLDER TO IMPLEMENT
│   │   ├── server.ts                      ← Needs middleware registration
│   │   ├── transport.ts                   ← Session management (secure)
│   │   └── index.ts                       ← Env validation & startup
│   ├── package.json                       ← Add auth dependencies here
│   └── README.md                          ← Document auth setup
├── .env.example                           ← Add auth variables
└── .docs/
    ├── oauth-authentication-exploration.md ← Full detailed report
    ├── OAUTH_FINDINGS_SUMMARY.txt          ← Quick reference
    └── AUTH_ARCHITECTURE_DIAGRAM.txt       ← Visual architecture
```

## Health Checks

The server runs health checks at startup for external API keys:

```typescript
// From index.ts - lines 48-67
if (process.env.SKIP_HEALTH_CHECKS !== 'true') {
  const healthResults = await runHealthChecks();
  // Validates FIRECRAWL_API_KEY, etc.
}
```

These are service authentication checks, NOT client authentication.

## Protocol Version

- **MCP Version**: 2025-03-26
- **Transport**: StreamableHTTPServerTransport
- **Primary Mode**: HTTP POST with JSON responses
- **Optional Streaming**: Server-Sent Events (SSE) for server-initiated messages
- **Session Header**: `Mcp-Session-Id` (UUID v4)

## Key Insights

1. **No Authentication**: Any client can create sessions
2. **Secure Session IDs**: Uses cryptographic UUIDs
3. **Session Isolation**: Each session is independent
4. **No Persistence**: Sessions lost on restart
5. **External Auth Exists**: Only for third-party services
6. **Placeholder Exists**: `authMiddleware` created but not used
7. **Production TODO**: Explicit checklist item #5 flags this

## Recommended Implementation

For production deployment before implementing full OAuth:

1. **Immediate**: Implement simple API key validation
   - Add `MCP_API_KEY` environment variable
   - Validate in `authMiddleware`
   - Return 401 if invalid

2. **Short-term**: Add rate limiting
   - Use `express-rate-limit`
   - Limit requests per IP/API key

3. **Long-term**: Implement OAuth 2.0
   - Support multiple providers
   - Token-based authentication
   - Audit logging

## Contact Points in Code

### Where Auth Should Be Added

- `remote/src/middleware/auth.ts` - Implementation
- `remote/src/server.ts` line 23 - Register: `app.use(authMiddleware)`
- `remote/src/index.ts` - Validate auth config variables

### Where Session Management Happens

- `remote/src/transport.ts` - Session ID generation
- `remote/src/server.ts` line 29 - Session storage
- `remote/src/eventStore.ts` - Event replay for resumability

### Where Config Is Loaded

- `remote/src/index.ts` - `dotenv.config()`
- `remote/src/transport.ts` - `ALLOWED_HOSTS`, `ALLOWED_ORIGINS`
- `remote/src/middleware/cors.ts` - `ALLOWED_ORIGINS`

---

For detailed information, see the accompanying documentation files:

- `oauth-authentication-exploration.md` - Complete technical analysis
- `AUTH_ARCHITECTURE_DIAGRAM.txt` - Visual architecture and flows
- `OAUTH_FINDINGS_SUMMARY.txt` - Comprehensive reference
