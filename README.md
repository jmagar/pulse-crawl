# Pulse Fetch MCP Server

Haven't heard about MCP yet? The easiest way to keep up-to-date is to read our [weekly newsletter at PulseMCP](https://www.pulsemcp.com/).

---

This is an MCP ([Model Context Protocol](https://modelcontextprotocol.io/)) Server that pulls specific resources from the open internet into context, designed for agent-building frameworks and MCP clients that lack built-in fetch capabilities.

Pulse Fetch is purpose-built for extracting clean, structured content from web pages while minimizing token usage and providing reliable access through intelligent fallback strategies.

This project is built and maintained by [PulseMCP](https://www.pulsemcp.com/).

# Table of Contents

- [Highlights](#highlights)
- [Capabilities](#capabilities)
- [Usage Tips](#usage-tips)
- [Examples](#examples)
- [Setup](#setup)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Claude Desktop](#claude-desktop)
    - [Local Setup](#local-setup)
    - [Remote Setup](#remote-setup)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
  - [Remote HTTP Server Connection Issues](#remote-http-server-connection-issues)
- [Scraping Strategy Configuration](#scraping-strategy-configuration)
- [Extract Feature](#extract-feature)

# Highlights

**Clean content extraction**: Strips out HTML noise using Mozilla's Readability algorithm to minimize token usage during MCP Tool calls.

**Intelligent caching**: Automatically caches scraped content as MCP Resources. Subsequent requests for the same URL return cached content instantly without network calls, dramatically improving performance.

**Enhanced scraping**: Integrates with Firecrawl API for enhanced content extraction and anti-scraping bypass.

**Smart strategy selection**: Automatically learns and applies the best scraping method for specific URL patterns, improving performance over time.

**LLM-optimized**: Offers MCP Prompts and descriptive Tool design for better LLM interaction reliability.

**Flexible formats**: Supports multiple output formats including clean markdown, HTML, screenshots, and structured data extraction.

**Intelligent extraction**: Extract specific information using natural language queries powered by LLMs.

# Capabilities

This server is built and tested on macOS with Claude Desktop. It should work with other MCP clients as well.

| Tool Name | Description                                                                                                                                                     |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scrape`  | Scrape a single webpage with advanced content extraction options and multiple output formats.                                                                   |
| `search`  | Search the web using Firecrawl with optional content scraping. Supports web, image, and news search with filtering by category (GitHub, research papers, PDFs). |
| `map`     | Discover URLs from a website using Firecrawl. Fast URL discovery (8x faster than crawl) with sitemap integration and subdomain handling.                        |
| `crawl`   | Manage website crawling jobs. Start multi-page crawls with url parameter, check status with jobId, or cancel with jobId + cancel=true.                          |

# Usage Tips

## Scrape Tool

- Handles all single-page web content extraction needs and automatically bypasses anti-bot protection when necessary
- **Result handling modes**: Control how scraped content is handled with the `resultHandling` parameter:
  - `saveAndReturn` (default): Saves content as MCP Resource AND returns it - best for reuse
  - `returnOnly`: Returns content without saving - use when you only need content once
  - `saveOnly`: Saves content as MCP Resource, returns only resource link - efficient for large content
- **Automatic caching**: Previously scraped URLs are cached by default. The tool returns cached content instantly on repeat requests
- Use `forceRescrape: true` to bypass the cache and get fresh content when you know the page has changed
- Use `maxChars` and `startIndex` parameters to handle large content that exceeds token limits
- Configure the timeout parameter (default 60s) for slow-loading sites
- Use the `extract` parameter with natural language queries to extract specific information from pages (requires LLM configuration)

## Search Tool

- Search the web for relevant content across multiple sources (web, images, news)
- Filter by category: GitHub repositories, research papers, PDFs
- Control result count with the `limit` parameter (default: 5, max: 100)
- Optionally scrape search results with `scrapeOptions` for full content extraction
- Returns organized results by source type with URLs, titles, and descriptions

## Map Tool

- Discover URLs from a website 8x faster than crawl (no content extraction)
- Perfect for site structure analysis and URL discovery before crawling
- Control URL limits with the `limit` parameter (default: 5000, max: 100,000)
- Filter URLs with `search` parameter to find specific pages
- Options for sitemap inclusion (`include`, `skip`, `only`)
- Subdomain and query parameter handling

## Crawl Tool

- Multi-page website crawling with content extraction from each page
- **Three operations in one tool**:
  - **Start crawl**: Provide `url` parameter to begin crawling
  - **Check status**: Provide `jobId` to get progress and partial results
  - **Cancel crawl**: Provide `jobId` + `cancel: true` to stop the job
- Control crawl scope with `maxDepth`, `includePaths`, `excludePaths`
- Limit pages with the `limit` parameter (default: 100, max: 100,000)
- Configure `allowSubdomains` and `allowExternalLinks` for broader crawls
- Customize scraping options for each page via `scrapeOptions`

# Examples

## Basic Web Content Extraction

```
User: "Get the main content from this article: https://example.com/article"
Assistant: I'll extract the content from that article for you.

[Uses scrape tool with onlyMainContent: true]

I've extracted the main article content. The article is titled "Example Article Title" and contains approximately 2,500 words discussing...
```

## Extracting Structured Data

```
User: "Extract the product information from this e-commerce page: https://shop.example.com/product/123"
Assistant: I'll extract the structured product data from that page.

[Uses scrape tool with format: 'extract' and appropriate schema]

I've extracted the product information:
- Product Name: Example Product
- Price: $99.99
- Rating: 4.5/5 stars
- Description: High-quality example product...
```

## Handling Protected Content

```
User: "This page is blocking me with CAPTCHA. Can you get the content from https://protected.example.com/data"
Assistant: I'll extract the content from that protected page for you.

[Uses scrape tool with automatic fallback to Firecrawl]

I successfully bypassed the protection and extracted the content from the page using Firecrawl's enhanced scraping capabilities.
```

## Intelligent Caching

```
User: "Get the content from https://example.com/article again"
Assistant: I'll retrieve that content for you.

[Uses scrape tool - automatically returns cached content]

I've retrieved the content from cache (originally scraped 2 hours ago). The article contains...

User: "Actually, I think that article was updated. Can you get the latest version?"
Assistant: I'll fetch a fresh copy of the article for you.

[Uses scrape tool with forceRescrape: true]

I've fetched the latest version of the article. I can see it was indeed updated with new information about...
```

## Result Handling Options

```
User: "I need to archive this entire article: https://example.com/long-article"
Assistant: I'll save that article as a resource for you.

[Uses scrape tool with resultHandling: 'saveOnly']

I've successfully archived the article. It's now saved as an MCP Resource that you can access later.

User: "Can you extract just the summary from https://example.com/report without saving it?"
Assistant: I'll extract just the summary without saving the full content.

[Uses scrape tool with resultHandling: 'returnOnly' and extract parameter]

Here's the summary I extracted from the report: [summary content]
```

# Why Choose Pulse Fetch?

If our [Design Principles](../README.md#design-principles) resonate with you, you should consider using our server.

The [official reference implementation of `fetch`](https://www.pulsemcp.com/servers/modelcontextprotocol-fetch) is the closest alternative. However:

- `fetch` has no mechanisms for bypassing anti-scraping technology, meaning attempts may randomly fail. We integrate with third-party services for reliable access.
- `fetch` is maintained by volunteers, so bugs or edge cases are less likely to be addressed quickly.
- `Pulse Fetch` caches responses as Resources, allowing easy inspection and re-use of Tool call outcomes.
- `Pulse Fetch` has more descriptive Tool design that more reliably triggers and completes desired tasks.

Most other alternatives fall short on one or more vectors:

- They are not purpose-built for pulling specific internet resources into context
- They may be multi-page crawlers, search engines, or tied to full REST APIs that confuse LLMs
- They do not make maximal use of MCP concepts like Resources and Prompts

# Setup

## Prerequisites

- Node.js (recommended: use the version specified in package.json)
- Claude Desktop application (for local setup)
- Optional: Firecrawl API key for enhanced scraping capabilities

## Environment Variables

### Core Configuration

| Environment Variable           | Description                                                         | Required | Default Value                | Example                           |
| ------------------------------ | ------------------------------------------------------------------- | -------- | ---------------------------- | --------------------------------- |
| `FIRECRAWL_API_KEY`            | API key for Firecrawl service for enhanced scraping                 | No       | N/A                          | `fc-abc123...`                    |
| `STRATEGY_CONFIG_PATH`         | Path to markdown file containing scraping strategy configuration    | No       | OS temp dir                  | `/path/to/scraping-strategies.md` |
| `OPTIMIZE_FOR`                 | Optimization strategy for scraping: `cost` or `speed`               | No       | `cost`                       | `speed`                           |
| `MCP_RESOURCE_STORAGE`         | Storage backend for saved resources: `memory` or `filesystem`       | No       | `memory`                     | `filesystem`                      |
| `MCP_RESOURCE_FILESYSTEM_ROOT` | Directory for filesystem storage (only used with `filesystem` type) | No       | `/tmp/pulse-crawl/resources` | `/home/user/mcp-resources`        |
| `SKIP_HEALTH_CHECKS`           | Skip API authentication health checks at startup                    | No       | `false`                      | `true`                            |

### LLM Configuration for Extract Feature

The extract feature provides an alternative to MCP's native sampling capability for clients that don't support it. When configured, it enables intelligent information extraction from scraped content using LLMs. If neither LLM configuration nor MCP sampling is available, the `extract` parameter will not be shown in the tool.

| Environment Variable | Description                                              | Required | Default Value      | Example                       |
| -------------------- | -------------------------------------------------------- | -------- | ------------------ | ----------------------------- |
| `LLM_PROVIDER`       | LLM provider: `anthropic`, `openai`, `openai-compatible` | No       | N/A                | `anthropic`                   |
| `LLM_API_KEY`        | API key for the chosen LLM provider                      | No       | N/A                | `sk-abc123...`                |
| `LLM_API_BASE_URL`   | Base URL for OpenAI-compatible providers                 | No       | N/A                | `https://api.together.xyz/v1` |
| `LLM_MODEL`          | Specific model to use for extraction                     | No       | See defaults below | `gpt-4-turbo`                 |

**Default Models:**

- Anthropic: `claude-sonnet-4-20250514` (Claude Sonnet 4 - latest and most capable)
- OpenAI: `gpt-4.1-mini` (GPT-4.1 Mini - latest and most capable)
- OpenAI-compatible: Provider-specific (must be specified)

## Claude Desktop

### Local Setup

You'll need Node.js installed on your machine to run the local version.

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add this configuration to your Claude Desktop config file:

**Minimal configuration** (uses native fetch only):

```json
{
  "mcpServers": {
    "pulse-crawl": {
      "command": "npx",
      "args": ["-y", "@pulsemcp/pulse-crawl"]
    }
  }
}
```

**Full configuration** (with all optional environment variables):

```json
{
  "mcpServers": {
    "pulse-crawl": {
      "command": "npx",
      "args": ["-y", "@pulsemcp/pulse-crawl"],
      "env": {
        "FIRECRAWL_API_KEY": "your-firecrawl-api-key",
        "STRATEGY_CONFIG_PATH": "/path/to/your/scraping-strategies.md",
        "OPTIMIZE_FOR": "cost",
        "MCP_RESOURCE_STORAGE": "filesystem",
        "MCP_RESOURCE_FILESYSTEM_ROOT": "/path/to/resource/storage"
      }
    }
  }
}
```

To set up the local version:

1. Clone or download the repository
2. Navigate to the local directory: `cd pulse-crawl/local`
3. Install dependencies: `npm install`
4. Build the project: `npm run build`
5. Update your Claude Desktop config with the correct path
6. Restart Claude Desktop

### Remote Setup (HTTP Streaming)

Pulse Fetch also supports HTTP streaming transport for network-accessible deployments. This is ideal for:

- Hosting MCP servers on remote servers
- Containerized deployments (Docker, Kubernetes)
- Cloud platforms (AWS, GCP, Azure)
- Multi-client environments
- Browser-based MCP clients

**Quick Start with HTTP Transport:**

```bash
# Navigate to remote directory
cd remote

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys and PORT

# Build and run
npm run build
npm start
```

The server will start on `http://localhost:3060` (configurable via PORT environment variable).

**Docker Deployment:**

```bash
cd remote
docker-compose up -d
```

**Connecting Clients:**

- **MCP Inspector**: `npx @modelcontextprotocol/inspector` → Connect to `http://localhost:3060/mcp`
- **Claude Code**: `claude mcp add --transport http pulse-crawl-remote http://localhost:3060/mcp`

For detailed documentation, configuration options, security considerations, and production deployment guides, refer to [Pulse Fetch HTTP Server Documentation](remote/README.md).

# Development

## Project Structure

```
pulse-crawl/
├── local/                    # Local stdio server implementation
│   ├── src/
│   │   └── index.ts         # Main entry point (stdio transport)
│   ├── build/               # Compiled output
│   └── package.json
├── remote/                   # HTTP streaming server implementation
│   ├── src/
│   │   ├── index.ts         # Main entry point (HTTP transport)
│   │   ├── server.ts        # Express server setup
│   │   ├── transport.ts     # StreamableHTTP transport factory
│   │   ├── eventStore.ts    # Event storage for resumability
│   │   └── middleware/      # CORS, health checks, auth
│   ├── build/               # Compiled output
│   ├── Dockerfile           # Docker image
│   ├── docker-compose.yml   # Docker Compose config
│   └── package.json
└── shared/                   # Shared business logic (used by both)
    ├── src/
    │   ├── tools.ts         # Tool implementations
    │   ├── resources.ts     # Resource implementations
    │   ├── healthcheck.ts   # API health checks
    │   └── types.ts         # Shared types
    └── package.json
```

### Transport Implementations

Pulse Fetch provides two transport mechanisms:

| Transport          | Package                        | Use Case                             | Protocol               |
| ------------------ | ------------------------------ | ------------------------------------ | ---------------------- |
| **stdio**          | `@pulsemcp/pulse-crawl`        | Claude Desktop, local CLI tools      | stdin/stdout           |
| **HTTP Streaming** | `@pulsemcp/pulse-crawl-remote` | Remote servers, Docker, multi-client | HTTP (JSON) + opt. SSE |

Both implementations share the same core functionality (`shared/`) ensuring feature parity.

## Running in Development Mode

```bash
# Build shared module first
cd shared
npm install
npm run build

# Run local server in development
cd ../local
npm install
npm run dev
```

## Testing

This project includes comprehensive testing capabilities:

```bash
# Install all dependencies
npm run install-all

# Run tests (if implemented)
npm test

# Run linting
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

## Linting and Formatting

The project uses ESLint and Prettier for code quality and consistency:

```bash
# Check for linting issues
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format all code
npm run format

# Check if code is properly formatted
npm run format:check
```

## Tools Reference

### scrape

Scrape a single webpage with advanced options for content extraction.

**Content Cleaning**

By default (`cleanScrape: true`), the tool automatically cleans scraped content:

- **HTML content**: Converts to semantic Markdown, removing navigation, ads, sidebars, and other boilerplate while preserving the main content structure. This typically reduces content size by 50-90%.
- **JSON/XML content**: Passes through unchanged (already structured)
- **Plain text**: Passes through unchanged

Disable cleaning (`cleanScrape: false`) only when:

- You need the exact raw HTML structure for parsing
- You're debugging scraping issues
- You're working with pre-structured content

**Parameters:**

- `url` (string, required): URL to scrape (e.g., "https://example.com" or just "example.com" - https:// is added automatically if no protocol is specified)
- `timeout` (number): Maximum time to wait for page load
- `maxChars` (number): Maximum characters to return (default: 100,000)
- `startIndex` (number): Character index to start output from (for pagination)
- `saveResult` (boolean): Save result as MCP Resource (default: true)
- `forceRescrape` (boolean): Force fresh scrape even if cached (default: false)
- `cleanScrape` (boolean): Clean HTML content by converting to semantic Markdown (default: true)
- `extract` (string): Natural language query for intelligent content extraction (requires LLM configuration)

## Roadmap & Future Ideas

### Planned Features

- [ ] MCP Sampling support for extraction - use the MCP client's native LLM capabilities when available
- [ ] Sampling (with external API fallback) to determine whether scrape was a success (and thus save it as a learning)
  - [ ] Right now, we determine whether a scrape succeeded based on HTTP status codes, which may not be reliable (e.g. 200 but anti-bot screen)
- [ ] Screenshot support
  - [ ] Allow format of `screenshot` and `screenshot-full-page` in `scrape` tool

### Future Enhancement Ideas

**Enhanced scraping parameters:**

- `includeHtmlTags`: HTML tags to include in output
- `excludeHtmlTags`: HTML tags to exclude from output
- `customUserAgent`: Custom User-Agent string
- `ignoreRobotsTxt`: Whether to ignore robots.txt restrictions
- `proxyUrl`: Optional proxy URL
- `headers`: Custom headers for requests
- `followLinks`: Follow related links on the page

**Interactive capabilities:**

- Execute custom actions like clicking or scrolling before scraping

**Image processing:**

- `imageStartIndex`: Starting position for image collection
- `raw`: Return raw content instead of processed markdown
- `imageMaxCount`: Maximum images to process per request
- `imageMaxHeight/Width`: Image dimension limits
- `imageQuality`: JPEG quality (1-100)
- `enableFetchImages`: Enable image fetching and processing

## Troubleshooting

### Remote HTTP Server Connection Issues

When connecting to the Pulse Fetch HTTP server, you may encounter connection errors. Here are the most common issues and solutions:

#### Issue 1: Invalid Host Header (403 Forbidden)

**Symptoms:**

```text
HTTP 403: Invalid Host header: 100.122.19.93:3060
Streamable HTTP connection failed
```

**Cause:** DNS rebinding protection is blocking your client's Host header. The server validates the `Host` header against an allowlist for security.

**Solution:** Add your connection IP/hostname to the `ALLOWED_HOSTS` environment variable:

```bash
# In .env file
ALLOWED_HOSTS=localhost:3060,100.122.19.93:3060,127.0.0.1:3060
```

**Important notes:**

- Include the **port number** (e.g., `:3060`) in each entry
- Separate multiple entries with commas
- Include all variations: localhost, 127.0.0.1, Docker bridge IPs, Tailscale IPs, etc.
- For Tailscale connections, IPs typically start with `100.x.x.x`

**For development only:** Set `NODE_ENV=development` to disable DNS rebinding protection:

```bash
NODE_ENV=development
```

⚠️ **Security Warning:** Only disable protection in trusted development environments, never in production.

#### Issue 2: Tool Schema Validation Errors (400 Bad Request)

**Symptoms:**

```text
ZodError: Invalid literal value, expected "object"
Path: tools[1].inputSchema.type
```

**Cause:** MCP clients expect tool `inputSchema` to have `type: "object"` at the root level, but some schema conversion methods wrap schemas in `$ref` or use union types (`anyOf`/`oneOf`) at the root.

**Solution:** This should be fixed in the latest version. If you encounter this:

1. Ensure you're on the latest version: `npm update`
2. Rebuild the project: `npm run build`
3. Restart the server

**For developers:** When using `zodToJsonSchema()`, avoid passing a name parameter:

```typescript
// ❌ Wrong - creates $ref wrapper
inputSchema: zodToJsonSchema(schema, 'schemaName');

// ✅ Correct - creates object at root
inputSchema: zodToJsonSchema(schema);

// ✅ For union schemas, add type manually
const baseSchema = zodToJsonSchema(unionSchema);
const inputSchema = { type: 'object' as const, ...baseSchema };
```

#### Issue 3: Session Not Found / "no session" in Logs

**Symptoms:**

```text
[INFO] MCP: POST request (no session)
Session not found
```

**Understanding the behavior:**

The log message `POST request (no session)` is **normal for the first request** from any client. This is the initialization request that creates the session. You should see these logs in sequence:

```text
1. POST request (no session)        ← First request (normal)
2. Session initialized {sessionId}  ← Session created
3. POST request for session         ← Subsequent requests reuse session
```

**If you only see "no session" repeatedly:**

- Check that the client is properly handling the `Mcp-Session-Id` header
- Verify the client extracts and sends the session ID on subsequent requests
- Check for Host header issues (see Issue 1 above) blocking initialization

#### Issue 4: CORS Policy Violations

**Symptoms:**

```text
Access to fetch at 'http://localhost:3060/mcp' has been blocked by CORS policy
No 'Access-Control-Allow-Origin' header present
```

**Solution:** Configure `ALLOWED_ORIGINS` in your `.env` file:

```bash
# Allow specific origins
ALLOWED_ORIGINS=https://app.example.com,http://localhost:3000

# Or allow all origins (development only)
ALLOWED_ORIGINS=*
```

**Note:** When using `ALLOWED_ORIGINS=*`, credentials are automatically disabled per CORS spec.

### General Debugging Steps

1. **Check server logs:**

   ```bash
   docker compose logs -f pulse-crawl
   ```

2. **Verify environment variables:**

   ```bash
   docker compose exec pulse-crawl env | grep -E 'ALLOWED_HOSTS|NODE_ENV|PORT'
   ```

3. **Test health endpoint:**

   ```bash
   curl http://localhost:3060/health
   ```

4. **Test with proper headers:**

   ```bash
   curl -v -H "Host: localhost:3060" http://localhost:3060/health
   ```

5. **Check MCP initialization:**

   ```bash
   curl -X POST http://localhost:3060/mcp \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"test","version":"1.0.0"}},"id":1}'
   ```

### Still Having Issues?

For detailed HTTP server documentation, including security configuration and production deployment, see [Pulse Fetch HTTP Server Documentation](remote/README.md).

## License

MIT

## Authentication Health Checks

Pulse Fetch validates API credentials at server startup to fail fast when authentication is misconfigured. This prevents silent failures during tool execution.

**Health Check Behavior:**

- Runs automatically when the server starts (unless disabled)
- Makes minimal test requests to verify API keys without consuming credits
- Exits with clear error messages if authentication fails
- Can be disabled by setting `SKIP_HEALTH_CHECKS=true`

**Example output with invalid credentials:**

```
Running authentication health checks...

Authentication health check failures:
  Firecrawl: Invalid API key - authentication failed

To skip health checks, set SKIP_HEALTH_CHECKS=true
```

# Scraping Strategy Configuration

The pulse-crawl MCP server includes an intelligent strategy system that automatically selects the best scraping method for different websites.

## Optimization Modes

The `OPTIMIZE_FOR` environment variable controls the order and selection of scraping strategies:

- **`COST` (default)**: Optimizes for the lowest cost by trying native fetch first, then Firecrawl
  - Order: `native → firecrawl`
  - Best for: Most use cases where cost is a concern
  - Behavior: Always tries the free native method first before paid services

- **`SPEED`**: Optimizes for faster results by using Firecrawl directly
  - Order: `firecrawl` (skips native entirely)
  - Best for: Time-sensitive applications or sites known to block native fetch
  - Behavior: Goes straight to Firecrawl, which is more likely to succeed on complex sites

Example configuration:

```bash
export OPTIMIZE_FOR=SPEED  # For faster, more reliable scraping
export OPTIMIZE_FOR=COST   # For cost-effective scraping (default)
```

> **📚 For detailed information on strategy selection, see [docs/STRATEGY_SELECTION.md](docs/STRATEGY_SELECTION.md)**
>
> This comprehensive guide covers:
>
> - How the system decides between native and Firecrawl
> - Optimization mode recommendations for different use cases
> - URL-specific strategy configuration
> - Auto-learning and diagnostics
> - Best practices for self-hosted Firecrawl

## How It Works

1. **Configured Strategy**: The server checks a local config file for URL-specific strategies
2. **Universal Fallback**: If no configured strategy exists or it fails, falls back to the universal approach (native → firecrawl)
3. **Auto-Learning**: When a strategy succeeds, it's automatically saved to the config file with an intelligent URL pattern for future use

## Strategy Types

- **`native`**: Fast native fetch using Node.js fetch API (best for simple pages)
- **`firecrawl`**: Enhanced content extraction using Firecrawl API (good for complex layouts and anti-bot bypass)

## Configuration File

The configuration is stored in a markdown table. By default, it's automatically created in your OS temp directory (e.g., `/tmp/pulse-crawl/scraping-strategies.md` on Unix systems). You can customize the location by setting the `STRATEGY_CONFIG_PATH` environment variable.

The table has three columns:

- **prefix**: Domain or URL prefix to match (e.g., `reddit.com` or `reddit.com/r/`)
- **default_strategy**: The strategy to use (`native` or `firecrawl`)
- **notes**: Optional description or reasoning

### Example Configuration

```markdown
| prefix        | default_strategy | notes                                                 |
| ------------- | ---------------- | ----------------------------------------------------- |
| reddit.com/r/ | firecrawl        | Reddit requires enhanced scraping for subreddit pages |
| reddit.com    | firecrawl        | General Reddit pages work well with Firecrawl         |
| github.com    | native           | GitHub pages are simple and work with native fetch    |
```

### Prefix Matching Rules

- **Domain matching**: `github.com` matches `github.com`, `www.github.com`, and `subdomain.github.com`
- **Path matching**: `reddit.com/r/` matches `reddit.com/r/programming` but not `reddit.com/user/test`
- **Longest match wins**: If multiple prefixes match, the longest one is used

## Automatic Strategy Discovery

When scraping a new URL:

1. The system tries the universal fallback sequence (native → firecrawl)
2. The first successful strategy is automatically saved to the config file with an intelligently extracted URL pattern
3. Future requests matching that pattern will use the discovered strategy

### URL Pattern Extraction

The system extracts URL patterns by removing the last path segment:

- **`yelp.com/biz/dolly-san-francisco`** → `yelp.com/biz/`
- **`reddit.com/r/programming/comments/123`** → `reddit.com/r/programming/comments/`
- **`example.com/blog/2024/article`** → `example.com/blog/2024/`
- **`stackoverflow.com/questions/123456`** → `stackoverflow.com/questions/`

For single-segment URLs or root URLs, only the hostname is saved. Query parameters and fragments are ignored during pattern extraction.

## Configuration Client Abstraction

The system uses an abstraction layer for config storage:

- **FilesystemClient**: Stores config in a local markdown file (default)
  - Uses `STRATEGY_CONFIG_PATH` if set
  - Otherwise uses OS temp directory (e.g., `/tmp/pulse-crawl/scraping-strategies.md`)
  - Automatically creates initial config with common patterns
- **Future clients**: Could support GCS, S3, database storage, etc.

You can swap the storage backend by providing a different `StrategyConfigFactory` when creating the MCP server.

# Resource Storage

Pulse Fetch stores scraped content as MCP Resources for caching and later retrieval. The storage system supports multiple tiers to preserve content at different processing stages.

## Storage Structure

Resources are saved in three separate stages:

1. **Raw**: Original content as scraped from the website
2. **Cleaned**: Cleaned content after applying content cleaners (HTML → Markdown, etc.)
3. **Extracted**: LLM-processed content containing only the requested information

### FileSystem Storage

When using filesystem storage (`MCP_RESOURCE_STORAGE=filesystem`), files are organized into subdirectories:

```
/tmp/pulse-crawl/resources/
├── raw/
│   └── example.com_article_20250701_123456.md
├── cleaned/
│   └── example.com_article_20250701_123456.md
└── extracted/
    └── example.com_article_20250701_123456.md
```

Each stage shares the same filename for easy correlation. The extracted files include the extraction prompt in their metadata for full traceability.

### Memory Storage

Memory storage uses a similar structure with URIs like:

- `memory://raw/example.com_article_20250701_123456`
- `memory://cleaned/example.com_article_20250701_123456`
- `memory://extracted/example.com_article_20250701_123456`

## Benefits

- **Debugging**: Easily inspect content at each processing stage
- **Efficiency**: Reuse cleaned content for different extraction queries
- **Traceability**: Track how content was transformed through each stage
- **Flexibility**: Choose which version to return based on your needs

# Extract Feature

The extract feature enables intelligent information extraction from scraped web content using LLMs. It serves as an alternative to MCP's native sampling capability for clients that don't support it.

## Overview

The extract functionality provides two ways to extract information:

1. **MCP Sampling** (not yet implemented): Uses the MCP client's native LLM capabilities
2. **Direct LLM API calls**: Configurable fallback using your own API keys

When neither option is available, the tool will work without extraction capabilities, returning raw scraped content only.

## How It Works

When you provide an `extract` parameter with a natural language query, the tool will:

1. First scrape the webpage content normally
2. Process the content through an LLM to extract the requested information
3. Return the extracted data instead of the raw HTML

## Architecture

### LLM Provider Support

The implementation supports three provider types:

1. **Anthropic (Native)**: Direct integration using Anthropic's SDK
   - Best for: Claude models with advanced reasoning capabilities
   - API: Uses Anthropic's native format

2. **OpenAI**: Direct integration with OpenAI's API
   - Best for: GPT-4 and GPT-3.5 models
   - API: Standard OpenAI format

3. **OpenAI-Compatible**: Support for any provider with OpenAI-compatible endpoints
   - Includes: Together.ai, Groq, Perplexity, DeepSeek, Fireworks AI, and more
   - API: OpenAI format with custom base URLs

### Configuration

Configure the extract feature using the environment variables described in the [LLM Configuration](#llm-configuration-for-extract-feature) section above.

### Usage Examples

#### Basic Extraction

```
User: "Get the author and publication date from this article: https://example.com/article"
Assistant: I'll extract that information from the article.

[Uses scrape tool with extract: "author name and publication date"]

The article was written by John Doe and published on March 15, 2024.
```

#### Complex Data Extraction

```
User: "Extract all product specifications from this page: https://shop.example.com/laptop"
Assistant: I'll extract the detailed specifications from that product page.

[Uses scrape tool with extract: "all technical specifications including processor, RAM, storage, display details, ports, and dimensions"]

Here are the laptop specifications:
- Processor: Intel Core i7-13700H
- RAM: 16GB DDR5
- Storage: 512GB NVMe SSD
...
```

### Implementation Strategy

1. **Client Abstraction Layer**: Common interface for all LLM providers
2. **Provider-Specific Clients**:
   - `AnthropicClient`: Native Anthropic API integration
   - `OpenAIClient`: OpenAI API integration
   - `OpenAICompatibleClient`: Flexible client for any OpenAI-compatible endpoint
3. **Extraction Pipeline**:
   - Content preprocessing and chunking for large documents
   - Smart prompting based on extraction query
   - Response parsing and formatting
4. **Fallback Mechanisms**:
   - MCP sampling as primary method (when available)
   - Direct API calls as fallback
   - Error handling and retry logic

### Why This Approach?

- **Flexibility**: Users can choose their preferred LLM provider
- **Cost Optimization**: Support for various providers allows cost/performance trade-offs
- **Future-Proof**: OpenAI-compatible interface ensures new providers work automatically
- **MCP-First**: Designed to use MCP's sampling capabilities when available (not yet implemented)
