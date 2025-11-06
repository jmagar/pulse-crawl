# Docstring Coverage Plan: 25% → 80%

**Status**: Ready for Implementation
**Current Coverage**: ~25%
**Target Coverage**: 80%
**Estimated Time**: 8-9 hours (or 4-5 hours for 80% minimum)
**Last Updated**: 2025-11-06

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Documentation Standards](#documentation-standards)
4. [Implementation Strategy](#implementation-strategy)
5. [Phase-by-Phase Breakdown](#phase-by-phase-breakdown)
6. [Verification Process](#verification-process)
7. [Success Criteria](#success-criteria)
8. [Risk Mitigation](#risk-mitigation)
9. [Quick Start Guide](#quick-start-guide)

---

## Executive Summary

### Problem

CodeRabbit's PR review identified docstring coverage at **25%** with a required threshold of **80%**. This creates technical debt and reduces code maintainability.

### Solution

Systematically add JSDoc-style docstrings to all public exports across the codebase, prioritizing core functionality first.

### Approach

**Hybrid Batch Processing**: Document high-priority modules first (Batches 1-4) to reach 80%, then optionally complete remaining modules.

### Key Metrics

- **116 total TypeScript files** (excluding tests, dist, node_modules)
- **67 files in shared/** (core business logic)
- **~59 files have some documentation** (88% file coverage)
- **~25% function/class coverage** (many files have partial docs)
- **~220 total public exports** estimated across codebase

---

## Current State Analysis

### File Distribution

```
Total Production Files: 78
├── shared/      67 files (86%)  - Core business logic
├── remote/       9 files (12%)  - HTTP transport
└── local/        2 files (2%)   - Stdio transport

Test Files: 38 (excluded from coverage requirements)
```

### Coverage by Module

| Module                     | Files | Est. Coverage | Priority    |
| -------------------------- | ----- | ------------- | ----------- |
| `shared/mcp/`              | 8     | 40%           | 🔴 Critical |
| `shared/scraping/`         | 15    | 30%           | 🔴 Critical |
| `shared/processing/`       | 20    | 20%           | 🟠 High     |
| `shared/resource-storage/` | 8     | 15%           | 🟠 High     |
| `shared/config/`           | 6     | 35%           | 🟡 Medium   |
| `shared/utils/`            | 5     | 50%           | 🟢 Low      |
| `remote/`                  | 9     | 25%           | 🟡 Medium   |
| `local/`                   | 2     | 10%           | 🟡 Medium   |

### Existing Documentation Quality

**Strengths**:

- Most files have some documentation
- Core utilities (`shared/utils/errors.ts`) well-documented
- Some factories have good examples

**Gaps**:

- Many class methods undocumented
- Interface properties lack descriptions
- Missing `@example` blocks for complex functions
- No module-level `@fileoverview` comments
- Inconsistent parameter descriptions

---

## Documentation Standards

### Format: JSDoc

We use standard JSDoc format for TypeScript documentation:

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

### What Requires Documentation

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

### Documentation Templates

#### Function Documentation

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
export function createScrapingClient(url: string, config: ScrapeConfig): ScrapingClient {}
````

#### Class Documentation

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

#### Interface Documentation

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

#### Type Documentation

```typescript
/**
 * Result of a scraping operation
 *
 * Contains the scraped content, metadata, and information about
 * how the content was obtained and processed.
 */
export type ScrapeResult = {
  /** Scraped content (markdown or raw HTML) */
  content: string;

  /** Metadata about the scraping operation */
  metadata: {
    /** URL that was scraped */
    url: string;

    /** Strategy used for scraping */
    strategy: string;

    /** Timestamp of scraping operation */
    timestamp: string;

    /** Whether content was cleaned/converted */
    cleaned: boolean;
  };

  /** URI of stored resource (if saved) */
  resourceUri?: string;
};
```

#### Module Documentation

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

---

## Implementation Strategy

### Recommended Approach: Hybrid Batch Processing

Document modules in priority order, committing after each batch. This allows:

- ✅ Incremental progress tracking
- ✅ Early feedback on documentation style
- ✅ Lower risk of merge conflicts
- ✅ Ability to stop at 80% threshold

### Alternative Approaches

**Option B: Full Sweep**

- Document everything in one session
- Single large commit
- Faster but higher risk
- Harder to review

**Option C: Opportunistic**

- Document as you touch files
- Spreads work over time
- Never reaches completion
- ❌ Not recommended for deadline-driven goal

---

## Phase-by-Phase Breakdown

### Phase 0: Preparation (30 minutes)

#### Create Documentation Guidelines

Create `.docs/docstring-guidelines.md`:

```markdown
# Docstring Guidelines for Pulse Fetch

## Quick Reference

[Templates and examples from this plan]

## Common Patterns

- Factory functions
- Client classes
- Configuration objects
- Error handling utilities

## Review Checklist

- [ ] All public exports documented
- [ ] Parameters and returns described
- [ ] Complex functions have examples
- [ ] Error conditions noted
```

#### Create Coverage Check Script

Create `.scripts/check-docstrings.ts`:

```typescript
#!/usr/bin/env node
/**
 * Check docstring coverage across TypeScript files
 *
 * Scans for exported functions, classes, interfaces, and types
 * without JSDoc documentation and reports coverage percentage.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Implementation details...
```

#### Set Up Todo Tracking

Create todos for each batch to track progress systematically.

---

### Phase 1: Core MCP Interface (60 minutes)

**Objective**: Document the primary MCP server interface
**Target Coverage**: 35-40% total
**Files**: 5 files, ~40 exports

#### Batch 1 Files

1. **`shared/types.ts`** (15 minutes)
   - Core type definitions
   - Document: `ToolResponse`, `ScrapeOptions`, `ResourceStorage`, etc.
   - Add module-level `@fileoverview`
   - ~15 exports

2. **`shared/mcp/tools/scrape/schema.ts`** (10 minutes)
   - Tool input schema and Zod validators
   - Document: Schema definitions, validation logic
   - ~8 exports

3. **`shared/mcp/tools/scrape/index.ts`** (15 minutes)
   - Main scrape tool implementation
   - Document: Tool handler, orchestration logic
   - ~5 exports

4. **`shared/mcp/registration.ts`** (10 minutes)
   - MCP tool/resource registration
   - Document: `registerTools()`, `registerResources()`
   - ~4 exports

5. **`shared/server.ts`** (10 minutes)
   - MCP server factory
   - Document: Server creation, configuration
   - ~3 exports

#### Deliverables

- Core MCP interface fully documented
- Foundation for understanding system architecture
- Commit: `docs: add comprehensive docstrings to MCP core interface`

---

### Phase 2: Scraping Clients (90 minutes)

**Objective**: Document all scraping implementations
**Target Coverage**: 50-55% total
**Files**: 8 files, ~50 exports

#### Batch 2 Files

6. **`shared/scraping/clients/firecrawl/client.ts`** (15 minutes)
   - Firecrawl API client
   - Document: Client class, methods, configuration
   - ~8 exports

7. **`shared/scraping/clients/firecrawl/api.ts`** (10 minutes)
   - Firecrawl API types and interfaces
   - Document: Request/response types
   - ~6 exports

8. **`shared/scraping/clients/native/native-scrape-client.ts`** (15 minutes)
   - Native fetch implementation
   - Document: Client class, fetch logic
   - ~6 exports

9. **`shared/scraping/strategies/selector.ts`** (15 minutes)
   - Strategy selection logic
   - Document: Selection algorithm, fallback logic
   - ~8 exports

10. **`shared/scraping/strategies/learned/types.ts`** (10 minutes)
    - Learned strategy types
    - Document: Configuration types, learned patterns
    - ~8 exports

11. **`shared/scraping/strategies/learned/filesystem-client.ts`** (10 minutes)
    - File-based strategy storage
    - Document: Storage operations
    - ~5 exports

12. **`shared/scraping/strategies/learned/default-config.ts`** (10 minutes)
    - Default strategy configuration
    - Document: Default patterns, common sites
    - ~4 exports

13. **`shared/scraping/clients/index.ts`** (5 minutes)
    - Client exports
    - Add module overview

#### Deliverables

- Complete scraping layer documentation
- Clear understanding of strategy selection
- Commit: `docs: add comprehensive docstrings to scraping clients`

---

### Phase 3: Processing Pipeline (120 minutes)

**Objective**: Document content processing (extraction, parsing, cleaning)
**Target Coverage**: 70-75% total
**Files**: 15 files, ~60 exports

#### Batch 3A: Extraction (40 minutes)

14. **`shared/processing/extraction/types.ts`** (10 minutes)
    - LLM extraction types
    - Document: Config, client interfaces
    - ~6 exports

15. **`shared/processing/extraction/factory.ts`** (10 minutes)
    - Client factory
    - Document: Factory methods, provider selection
    - ~4 exports

16-18. **Provider clients** (20 minutes) - `anthropic-client.ts` - `openai-client.ts` - `openai-compatible-client.ts` - Document: Each client implementation - ~15 exports combined

#### Batch 3B: Parsing (40 minutes)

19. **`shared/processing/parsing/base-parser.ts`** (8 minutes)
    - Base parser interface
    - ~3 exports

20. **`shared/processing/parsing/html-parser.ts`** (10 minutes)
    - HTML parsing logic
    - ~4 exports

21. **`shared/processing/parsing/pdf-parser.ts`** (10 minutes)
    - PDF parsing logic
    - ~4 exports

22. **`shared/processing/parsing/passthrough-parser.ts`** (5 minutes)
    - No-op parser
    - ~2 exports

23. **`shared/processing/parsing/parser-factory.ts`** (7 minutes)
    - Parser selection
    - ~3 exports

#### Batch 3C: Cleaning (40 minutes)

24. **`shared/processing/cleaning/content-type-detector.ts`** (10 minutes)
    - Content type detection
    - ~4 exports

25. **`shared/processing/cleaning/html-cleaner.ts`** (15 minutes)
    - HTML to Markdown conversion
    - ~5 exports

26. **`shared/processing/cleaning/pass-through-cleaner.ts`** (5 minutes)
    - No-op cleaner
    - ~2 exports

27. **`shared/processing/cleaning/cleaner-factory.ts`** (10 minutes)
    - Cleaner selection
    - ~3 exports

#### Deliverables

- Complete processing pipeline documentation
- Clear understanding of content transformation
- Commit: `docs: add comprehensive docstrings to processing pipeline`

---

### Phase 4: Storage & Configuration (60 minutes)

**Objective**: Document resource storage and configuration
**Target Coverage**: 78-82% total ✅ **TARGET REACHED**
**Files**: 10 files, ~45 exports

#### Batch 4A: Resource Storage (30 minutes)

28-32. **`shared/resource-storage/` all files** - Memory storage implementation - Filesystem storage implementation - Storage interfaces and types - Factory pattern - ~25 exports

#### Batch 4B: Configuration (30 minutes)

33. **`shared/config/validation-schemas.ts`** (12 minutes)
    - Zod validation schemas
    - ~8 exports

34. **`shared/config/health-checks.ts`** (8 minutes)
    - Health check implementations
    - ~4 exports

35. **`shared/config/crawl-config.ts`** (10 minutes)
    - Crawl configuration
    - ~5 exports

#### Deliverables

- Complete storage and config documentation
- **80% coverage threshold achieved** 🎯
- Commit: `docs: add comprehensive docstrings to storage and config layers`

---

### Phase 5: Utilities & Helpers (45 minutes) [OPTIONAL]

**Objective**: Document utility functions
**Target Coverage**: 82-86% total
**Files**: 6 files, ~30 exports

#### Batch 5 Files

36. **`shared/utils/errors.ts`** (8 minutes)
    - Already well-documented, verify completeness
    - ~6 exports

37. **`shared/utils/logging.ts`** (10 minutes)
    - Logging utilities
    - ~8 exports

38. **`shared/utils/responses.ts`** (8 minutes)
    - Response builders
    - ~5 exports

39. **`shared/mcp/tools/scrape/helpers.ts`** (8 minutes)
    - Tool helper functions
    - ~4 exports

40. **`shared/mcp/tools/scrape/pipeline.ts`** (6 minutes)
    - Pipeline orchestration
    - ~3 exports

41. **`shared/mcp/tools/scrape/response.ts`** (5 minutes)
    - Response formatting
    - ~4 exports

#### Deliverables

- Complete utilities documentation
- Commit: `docs: add comprehensive docstrings to utilities and helpers`

---

### Phase 6: Transport Layers (30 minutes) [OPTIONAL]

**Objective**: Document stdio and HTTP transports
**Target Coverage**: 85-90% total
**Files**: 4 files, ~20 exports

#### Batch 6 Files

42. **`remote/server.ts`** (10 minutes)
    - HTTP server setup
    - ~6 exports

43. **`remote/index.ts`** (5 minutes)
    - Remote entry point
    - ~3 exports

44. **`local/index.ts`** (10 minutes)
    - Local stdio entry point
    - ~5 exports

45. **`local/index.integration-with-mock.ts`** (5 minutes)
    - Integration test setup
    - ~3 exports

#### Deliverables

- Complete transport layer documentation
- Commit: `docs: add comprehensive docstrings to transport layers`

---

## Verification Process

### Automated Coverage Check

#### Step 1: Run Coverage Script

```bash
npm run check-docstrings
# or
npx ts-node .scripts/check-docstrings.ts
```

**Expected Output**:

```
Docstring Coverage Report
=========================
Total exports: 220
Documented: 176
Coverage: 80.0%

Files needing attention:
- shared/some-file.ts: 2/5 (40%)
- remote/another-file.ts: 1/3 (33%)
```

#### Step 2: Manual Spot Checks

Review 5-10 random files for quality:

- [ ] Descriptions are clear and helpful
- [ ] Parameters are explained
- [ ] Return values are documented
- [ ] Complex functions have examples
- [ ] No copy-paste errors in descriptions

#### Step 3: Build Test

Verify documentation can be generated:

```bash
# If using TypeDoc
npx typedoc --out docs/api shared/

# Check for errors
echo $?  # Should be 0
```

### Quality Checklist

For each completed batch, verify:

**Completeness**:

- [ ] All exported functions documented
- [ ] All exported classes documented
- [ ] All class public methods documented
- [ ] All exported interfaces documented
- [ ] All interface properties documented
- [ ] All exported types documented
- [ ] Module-level `@fileoverview` present

**Quality**:

- [ ] Descriptions are clear and concise
- [ ] Descriptions use imperative mood for functions
- [ ] Parameters have meaningful descriptions
- [ ] Return values are explained
- [ ] Error conditions noted with `@throws`
- [ ] Complex functions have `@example` blocks
- [ ] No placeholder text (e.g., "TODO")

**Consistency**:

- [ ] Follows JSDoc format
- [ ] Uses consistent terminology
- [ ] Parameter names match actual code
- [ ] No typos or grammar errors

---

## Success Criteria

### Primary Goal: 80% Coverage ✅

**Definition**: At least 80% of public exports have JSDoc docstrings

**Measurement**:

```
Coverage = (Documented Exports / Total Exports) × 100
80% = (176 / 220) × 100
```

### Secondary Goals

**Documentation Quality**:

- [ ] All core MCP interface documented
- [ ] All scraping clients documented
- [ ] All processing pipeline documented
- [ ] All public APIs have descriptions
- [ ] Complex functions have examples

**Maintainability**:

- [ ] Guidelines document created
- [ ] Coverage check script implemented
- [ ] Documentation standards established
- [ ] Templates available for reference

**Integration**:

- [ ] Can generate API documentation
- [ ] No TypeDoc build errors
- [ ] Passes CodeRabbit review
- [ ] Committed to repository

---

## Risk Mitigation

### Risk 1: Time Overrun

**Impact**: Medium
**Probability**: Medium

**Mitigation**:

- Use time-boxed batches
- Prioritize critical modules (Batches 1-4)
- Stop at 80% threshold if time-constrained

**Contingency**:

- Document only Batches 1-3 (reaches ~70-75%)
- Create follow-up plan for remaining work

### Risk 2: Inconsistent Style

**Impact**: Low
**Probability**: Medium

**Mitigation**:

- Create templates before starting
- Review first batch thoroughly
- Use copy-paste templates for similar patterns

**Contingency**:

- Run prettier/eslint to normalize format
- Batch review and corrections at end

### Risk 3: Breaking Changes

**Impact**: High
**Probability**: Very Low

**Mitigation**:

- **Only add comments, never modify code**
- Run tests after each batch
- Use separate commits per batch

**Contingency**:

- Revert problematic batch
- Review changes more carefully

### Risk 4: Coverage Tool Inaccuracy

**Impact**: Low
**Probability**: Low

**Mitigation**:

- Manual spot-checks alongside automated tool
- Use multiple measurement methods
- Reference CodeRabbit as source of truth

**Contingency**:

- Rely on CodeRabbit's analysis
- Document methodology differences

### Risk 5: Merge Conflicts

**Impact**: Medium
**Probability**: Low (if working on active branch)

**Mitigation**:

- Work in small batches
- Commit frequently
- Coordinate with team on active files

**Contingency**:

- Resolve conflicts per-batch
- Cherry-pick individual commits if needed

---

## Quick Start Guide

### Before You Begin

**Prerequisites**:

- [ ] Clear 4-9 hour time block
- [ ] Familiarize with JSDoc format
- [ ] Review existing documentation examples
- [ ] Create branch: `docs/docstring-coverage`

**Setup**:

```bash
# Create branch
git checkout -b docs/docstring-coverage

# Create guidelines document
mkdir -p .docs
touch .docs/docstring-guidelines.md

# Create coverage check script
mkdir -p .scripts
touch .scripts/check-docstrings.ts
```

### Execution Steps

**Step 1**: Choose your approach

- ✅ **Recommended**: Hybrid (Batches 1-4 for 80%)
- Alternative: Full sweep (all 6 batches)

**Step 2**: Create templates

- Copy templates from this document
- Save to `.docs/docstring-guidelines.md`

**Step 3**: Start with Batch 1

- Set timer for 60 minutes
- Document 5 files in `shared/mcp/` and `shared/types.ts`
- Run tests: `npm test`
- Commit: `docs: add docstrings to MCP core interface`

**Step 4**: Continue with remaining batches

- Follow time estimates
- Commit after each batch
- Check coverage after Batch 4

**Step 5**: Verify and finalize

- Run coverage check
- Manual quality review
- Update README if needed
- Push branch and create PR

### Time Management

**Suggested Schedule** (4-hour minimum):

```
Hour 1: Setup + Batch 1 (Core MCP)
Hour 2: Batch 2 (Scraping Clients)
Hour 3-4: Batch 3 (Processing Pipeline)
Hour 4-5: Batch 4 (Storage & Config) → 80% ✅
```

**Extended Schedule** (9-hour complete):

```
+Hour 5-6: Batch 5 (Utilities)
+Hour 6-7: Batch 6 (Transports)
+Hour 7-8: Verification & QA
+Hour 8-9: Finalization & PR
```

### Command Reference

```bash
# Check current coverage
npm run check-docstrings

# Run tests after changes
npm test

# Generate API docs
npx typedoc --out docs/api shared/

# Commit batch
git add shared/
git commit -m "docs: add docstrings to [batch name]"

# Check diff before commit
git diff --cached
```

---

## Appendix

### Progress Tracking

Use this checklist to track batch completion:

**Phase 1: Core MCP Interface**

- [ ] Batch 1: MCP Interface (60 min) → 35-40% coverage

**Phase 2: Scraping Clients**

- [ ] Batch 2: Scraping (90 min) → 50-55% coverage

**Phase 3: Processing Pipeline**

- [ ] Batch 3: Processing (120 min) → 70-75% coverage

**Phase 4: Storage & Config** [TARGET]

- [ ] Batch 4: Storage/Config (60 min) → **78-82% coverage** ✅

**Phase 5: Utilities** [OPTIONAL]

- [ ] Batch 5: Utilities (45 min) → 82-86% coverage

**Phase 6: Transport** [OPTIONAL]

- [ ] Batch 6: Transport (30 min) → 85-90% coverage

### Estimated Coverage After Each Batch

| Batch       | Cumulative Time | Coverage   | Status         |
| ----------- | --------------- | ---------- | -------------- |
| Start       | 0h              | 25%        | ⚪ Baseline    |
| Batch 1     | 1h              | 35-40%     | 🟡 In Progress |
| Batch 2     | 2.5h            | 50-55%     | 🟡 In Progress |
| Batch 3     | 4.5h            | 70-75%     | 🟡 In Progress |
| **Batch 4** | **6h**          | **78-82%** | 🟢 **Target**  |
| Batch 5     | 6.75h           | 82-86%     | 🔵 Bonus       |
| Batch 6     | 7.25h           | 85-90%     | 🔵 Bonus       |

### Related Documents

- [CLAUDE.md](./CLAUDE.md) - Project coding standards
- [README.md](./README.md) - Project overview
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines (if exists)

### References

- [JSDoc Official Documentation](https://jsdoc.app/)
- [TypeDoc Documentation](https://typedoc.org/)
- [TSDoc Standard](https://tsdoc.org/)

---

**Document Version**: 1.0
**Created**: 2025-11-06
**Last Modified**: 2025-11-06
**Owner**: Development Team
**Status**: Ready for Implementation
