# Parallel Implementation Plan - 5 Features

**Execution Date:** 2025-11-07
**Branch:** claude/codebase-review-011CUtVjfTcmypSCarj6REyb
**Method:** Test-Driven Development (TDD) with 5 parallel agents

---

## Overview

This document outlines the implementation strategy for 5 features being developed in parallel by independent agents. Each feature has been carefully scoped to minimize conflicts and enable concurrent development.

---

## Feature 1: Synchronize Dependencies

**Agent ID:** Agent-Dependencies
**Estimated Time:** 1-2 days
**Priority:** High
**Branch Strategy:** Work directly on current branch (no conflicts expected)

### Scope

Synchronize all dependency versions across `shared/`, `local/`, and `remote/` package.json files to ensure consistency and prevent version conflicts.

### Current Issues

```json
// Mismatches detected:
- @anthropic-ai/sdk: 0.36.3 (shared/remote) vs 0.68.0 (local)
- zod: 3.24.1 (shared/remote) vs 4.1.12 (local)
- openai: 4.104.0 (shared/remote) vs 6.8.1 (local)
- jsdom: 26.1.0 (shared/remote) vs 27.1.0 (local)
- pdf-parse: 1.1.1 (shared/remote) vs 2.4.5 (local)
- dotenv: 16.4.5 (remote) vs 17.2.3 (local)
```

### Implementation Steps (TDD)

1. **Write tests** (`tests/shared/dependency-sync.test.ts`)
   - Test that reads all package.json files
   - Validates versions match across modules
   - Checks for compatible version ranges

2. **Create sync script** (`scripts/sync-dependencies.js`)
   - Read all package.json files
   - Identify shared dependencies
   - Choose latest stable version for each
   - Update all package.json files

3. **Update dependencies**
   - Run sync script
   - Update package-lock.json files
   - Verify no breaking changes

4. **Add to CI/CD**
   - Add dependency sync validation to CI
   - Fail builds if versions drift

### Files Modified

- `shared/package.json`
- `local/package.json`
- `remote/package.json`
- `package-lock.json` (root)
- `shared/package-lock.json`
- `local/package-lock.json`
- `remote/package-lock.json`
- `scripts/sync-dependencies.js` (new)
- `scripts/validate-dependencies.js` (new)
- `tests/shared/dependency-sync.test.ts` (new)

### Conflict Risk: **LOW**
- Only touches package.json files and scripts
- No code logic changes

---

## Feature 2: Performance Monitoring

**Agent ID:** Agent-Monitoring
**Estimated Time:** 3-5 days
**Priority:** Medium
**Branch Strategy:** Work directly on current branch

### Scope

Add comprehensive performance monitoring for cache operations, scraping strategies, and request timing. Provide metrics for observability and optimization.

### Metrics to Track

1. **Cache Metrics**
   - Hit rate (hits / total requests)
   - Miss rate
   - Storage size
   - Eviction count (when implemented)

2. **Strategy Metrics**
   - Success rate per strategy (native, firecrawl)
   - Average execution time per strategy
   - Fallback frequency
   - Error counts by type

3. **Request Metrics**
   - Total request count
   - Average response time
   - P50, P95, P99 latencies
   - Error rate

### Implementation Steps (TDD)

1. **Write tests** (`tests/shared/monitoring/metrics.test.ts`)
   - Test metric collection
   - Test metric aggregation
   - Test metric export

2. **Create metrics infrastructure**
   - `shared/monitoring/metrics-collector.ts` - Core metrics collection
   - `shared/monitoring/types.ts` - Metric types and interfaces
   - `shared/monitoring/exporters/console-exporter.ts` - Console output
   - `shared/monitoring/exporters/json-exporter.ts` - JSON format

3. **Integrate with cache**
   - Add hooks to `shared/storage/index.ts`
   - Track read/write operations
   - Track cache hits/misses

4. **Integrate with strategies**
   - Add hooks to `shared/scraping/strategies/selector.ts`
   - Track strategy attempts and results
   - Track timing information

5. **Add HTTP endpoints** (remote only)
   - `GET /metrics` - Prometheus-compatible format
   - `GET /metrics/json` - JSON format

### Files Modified

- `shared/monitoring/index.ts` (new)
- `shared/monitoring/metrics-collector.ts` (new)
- `shared/monitoring/types.ts` (new)
- `shared/monitoring/exporters/console-exporter.ts` (new)
- `shared/monitoring/exporters/json-exporter.ts` (new)
- `shared/storage/index.ts` (add hooks)
- `shared/scraping/strategies/selector.ts` (add hooks)
- `remote/middleware/metrics.ts` (new)
- `tests/shared/monitoring/metrics.test.ts` (new)
- `tests/shared/monitoring/integration.test.ts` (new)

### Conflict Risk: **MEDIUM**
- Modifies `storage/index.ts` (potential conflict with cache eviction)
- Modifies `strategies/selector.ts` (isolated changes)

**Coordination:** Agent-Monitoring should complete storage hooks before Agent-CacheEviction modifies same file. If conflict occurs, Agent-CacheEviction has priority.

---

## Feature 3: Consolidate Firecrawl Clients

**Agent ID:** Agent-Consolidation
**Estimated Time:** 2-3 days
**Priority:** Medium
**Branch Strategy:** Work directly on current branch

### Scope

Consolidate duplicate Firecrawl client implementations from `shared/clients/` and `shared/scraping/clients/firecrawl/` into a single unified location.

### Current Duplication

**Location 1:** `shared/clients/`
- `firecrawl-search.client.ts`
- `firecrawl-map.client.ts`
- `firecrawl-crawl.client.ts`
- `firecrawl-error-types.ts`

**Location 2:** `shared/scraping/clients/firecrawl/`
- `client.ts` (scraping client)
- `api.ts` (API functions)

### Implementation Steps (TDD)

1. **Write tests** (`tests/shared/clients/firecrawl-unified.test.ts`)
   - Test unified client interface
   - Test all operations (scrape, search, map, crawl)
   - Test error handling

2. **Create unified client structure**
   - `shared/clients/firecrawl/index.ts` - Main exports
   - `shared/clients/firecrawl/client.ts` - Unified client class
   - `shared/clients/firecrawl/operations/scrape.ts` - Scrape operation
   - `shared/clients/firecrawl/operations/search.ts` - Search operation
   - `shared/clients/firecrawl/operations/map.ts` - Map operation
   - `shared/clients/firecrawl/operations/crawl.ts` - Crawl operation
   - `shared/clients/firecrawl/types.ts` - Shared types
   - `shared/clients/firecrawl/errors.ts` - Error types

3. **Update imports across codebase**
   - Update all files importing from old locations
   - Use new unified client

4. **Remove old files**
   - Delete duplicate implementations
   - Update tests to use new structure

### Files Modified

- `shared/clients/firecrawl/` (new directory structure)
- `shared/clients/firecrawl-*.ts` (remove)
- `shared/scraping/clients/firecrawl/` (consolidate into shared/clients/firecrawl/)
- All files importing Firecrawl clients (update imports)
- `shared/mcp/tools/search/pipeline.ts`
- `shared/mcp/tools/map/pipeline.ts`
- `shared/mcp/tools/crawl/pipeline.ts`
- `shared/scraping/strategies/selector.ts`
- `tests/shared/clients/firecrawl-unified.test.ts` (new)

### Conflict Risk: **MEDIUM**
- Modifies multiple tool pipeline files
- Changes import paths across codebase

**Coordination:** This agent should communicate completion to ensure other agents update their imports if needed.

---

## Feature 4: Screenshot Support

**Agent ID:** Agent-Screenshots
**Estimated Time:** 1 week
**Priority:** Medium
**Branch Strategy:** Work directly on current branch

### Scope

Add screenshot capability to the scrape tool, supporting both regular and full-page screenshots using Firecrawl's screenshot format.

### Requirements

1. **Schema updates**
   - Add `includeScreenshot` parameter (boolean)
   - Add `screenshotFullPage` parameter (boolean)
   - Add `screenshotType` parameter ('regular' | 'fullpage')

2. **Response handling**
   - Support base64 image data
   - Support image URLs
   - Add image metadata (dimensions, format, size)

3. **MCP protocol compliance**
   - Return images as MCP image content type
   - Support both data URIs and URLs

### Implementation Steps (TDD)

1. **Write tests** (`tests/functional/scrape-screenshot.test.ts`)
   - Test screenshot parameter validation
   - Test screenshot response format
   - Test MCP image content type
   - Test full-page screenshot option

2. **Update scrape schema**
   - Add screenshot parameters to `shared/mcp/tools/scrape/schema.ts`
   - Update Zod validation

3. **Update Firecrawl client**
   - Add screenshot format support
   - Handle base64 image data
   - Parse screenshot metadata

4. **Update scrape pipeline**
   - Pass screenshot options to Firecrawl
   - Process screenshot responses
   - Convert to MCP format

5. **Update response builder**
   - Add image content type support
   - Format base64 data URIs
   - Include metadata

### Files Modified

- `shared/mcp/tools/scrape/schema.ts` (add parameters)
- `shared/mcp/tools/scrape/pipeline.ts` (handle screenshots)
- `shared/mcp/tools/scrape/response.ts` (format images)
- `shared/clients/firecrawl/operations/scrape.ts` (if consolidated) OR
- `shared/scraping/clients/firecrawl/api.ts` (if not consolidated)
- `shared/types.ts` (add screenshot types)
- `tests/functional/scrape-screenshot.test.ts` (new)
- `tests/integration/screenshot.integration.test.ts` (new)
- `README.md` (document new feature)

### Conflict Risk: **LOW-MEDIUM**
- Modifies scrape tool files (isolated changes)
- May conflict with Firecrawl consolidation

**Coordination:** If Agent-Consolidation completes first, Agent-Screenshots should use the new unified client. Otherwise, work with existing structure and Agent-Consolidation will update.

---

## Feature 5: Cache Eviction

**Agent ID:** Agent-CacheEviction
**Estimated Time:** 3-5 days
**Priority:** Medium
**Branch Strategy:** Work directly on current branch

### Scope

Implement TTL-based cache eviction and LRU (Least Recently Used) policies for both memory and filesystem storage backends.

### Requirements

1. **TTL Support**
   - Configurable TTL per resource
   - Default TTL from environment variable
   - Automatic expiration on read
   - Background cleanup task

2. **LRU Policy**
   - Track access times
   - Configurable max cache size
   - Evict least recently used items when limit reached
   - Maintain access order efficiently

3. **Configuration**
   - `MCP_RESOURCE_TTL` - Default TTL in seconds (default: 86400 = 24h)
   - `MCP_RESOURCE_MAX_SIZE` - Max cache size in MB (default: 100MB)
   - `MCP_RESOURCE_MAX_ITEMS` - Max number of cached items (default: 1000)

### Implementation Steps (TDD)

1. **Write tests** (`tests/shared/storage/eviction.test.ts`)
   - Test TTL expiration
   - Test LRU eviction on size limit
   - Test LRU eviction on count limit
   - Test access time tracking
   - Test background cleanup

2. **Extend storage interfaces**
   - Add TTL to `ResourceMetadata`
   - Add `lastAccessTime` to metadata
   - Add `evict()` method to storage interface
   - Add `getStats()` for cache statistics

3. **Implement memory storage eviction**
   - Add LRU tracking (Map with insertion order)
   - Check TTL on read operations
   - Implement size-based eviction
   - Background cleanup task

4. **Implement filesystem storage eviction**
   - Store metadata with timestamps
   - Check TTL on read operations
   - Scan and remove expired files
   - Implement size-based eviction

5. **Add configuration**
   - Environment variable parsing
   - Validation with Zod schemas
   - Document in .env.example

### Files Modified

- `shared/storage/index.ts` (extend interface, add eviction)
- `shared/storage/memory-storage.ts` (implement LRU)
- `shared/storage/filesystem-storage.ts` (implement TTL cleanup)
- `shared/storage/types.ts` (add TTL, lastAccessTime)
- `shared/config/validation-schemas.ts` (add config)
- `.env.example` (document new variables)
- `tests/shared/storage/eviction.test.ts` (new)
- `tests/shared/storage/memory-eviction.test.ts` (new)
- `tests/shared/storage/filesystem-eviction.test.ts` (new)

### Conflict Risk: **MEDIUM-HIGH**
- Modifies core storage files also touched by Agent-Monitoring
- Changes storage interface used throughout codebase

**Coordination:** Agent-CacheEviction has priority on `storage/index.ts`. Agent-Monitoring should add hooks around the eviction logic, not interfere with it.

---

## Conflict Resolution Strategy

### Priority Order (in case of conflicts)

1. **Agent-Dependencies** - Highest priority (foundational)
2. **Agent-CacheEviction** - High priority (core storage changes)
3. **Agent-Consolidation** - Medium priority (structural changes)
4. **Agent-Monitoring** - Medium priority (additive changes)
5. **Agent-Screenshots** - Lower priority (feature addition)

### Conflict Scenarios

**Scenario 1: Agent-Monitoring vs Agent-CacheEviction (storage/index.ts)**
- Resolution: Agent-CacheEviction makes core changes first
- Agent-Monitoring adds hooks around eviction logic
- If conflict: Agent-CacheEviction rebases and continues

**Scenario 2: Agent-Screenshots vs Agent-Consolidation (Firecrawl clients)**
- Resolution: Agent-Screenshots adapts to whatever structure exists
- If consolidated: Use new structure
- If not: Use old structure, Agent-Consolidation updates later

**Scenario 3: Agent-Dependencies vs Any Other**
- Resolution: Agent-Dependencies completes first
- All agents run `npm install` after dependency sync
- Tests must pass with new dependency versions

### Communication Points

Each agent will create a status file: `AGENT_<NAME>_STATUS.md`

**Status Updates:**
- START: Agent begins work
- BLOCKED: Waiting for another agent
- COMPLETED: Work finished, tests pass
- CONFLICT: Merge conflict detected, needs resolution

---

## Test-Driven Development (TDD) Requirements

### All Agents Must Follow

1. **Write tests first** before implementation
2. **Tests must fail** initially (red)
3. **Implement minimal code** to make tests pass (green)
4. **Refactor** while keeping tests passing
5. **Run full test suite** before committing
6. **Document tests** with clear descriptions

### Test Coverage Requirements

- **Minimum 80% coverage** for new code
- **All edge cases** tested
- **Error scenarios** covered
- **Integration tests** where applicable

---

## Success Criteria

### Per Feature

- ✅ All tests pass (including existing tests)
- ✅ Test coverage meets requirements
- ✅ Code follows project conventions
- ✅ Documentation updated
- ✅ No linting errors
- ✅ Builds successfully

### Overall

- ✅ All 5 features implemented
- ✅ All agents report COMPLETED status
- ✅ No merge conflicts (or resolved)
- ✅ Full test suite passes
- ✅ Build succeeds
- ✅ Ready for code review

---

## Timeline

```
Day 1:
├── Agent-Dependencies: Complete dependency sync ✓
├── Agent-Consolidation: Create unified structure
├── Agent-Monitoring: Create metrics infrastructure
├── Agent-CacheEviction: Implement TTL support
└── Agent-Screenshots: Schema updates

Day 2:
├── Agent-Dependencies: CI integration ✓
├── Agent-Consolidation: Update imports, remove duplicates ✓
├── Agent-Monitoring: Integrate with cache/strategies
├── Agent-CacheEviction: Implement LRU policy
└── Agent-Screenshots: Pipeline implementation

Day 3:
├── Agent-Consolidation: Tests passing ✓
├── Agent-Monitoring: HTTP endpoints, tests passing ✓
├── Agent-CacheEviction: Background cleanup, tests ✓
└── Agent-Screenshots: Response formatting, tests

Day 4-5:
└── Agent-Screenshots: Integration tests, documentation ✓

Day 5:
└── All: Final integration, conflict resolution, review
```

---

## Post-Implementation

1. **Merge verification**: Ensure all changes work together
2. **Full test suite**: Run all tests including manual tests
3. **Build verification**: Build all packages
4. **Documentation review**: Ensure all docs are updated
5. **Create PR**: Detailed PR description with all changes

---

## Agent Initialization

Each agent will be launched with this plan and their specific section. They will work independently following TDD principles and update their status files regularly.

**Launch Command:** 5 parallel Task tool invocations in a single message.
