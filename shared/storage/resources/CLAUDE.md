# Storage - Resource Persistence

Storage abstraction for cached scrape results exposed as MCP resources.

## Architecture

**Factory Pattern**: [factory.ts](factory.ts) creates backend. **Two Backends**: Memory (default), Filesystem

## Files

- [types.ts](types.ts) - `ResourceStorage` interface
- [factory.ts](factory.ts) - `ResourceStorageFactory` singleton
- [memory.ts](memory.ts) - In-memory (Map-based)
- [filesystem.ts](filesystem.ts) - File-based with subdirs

## Configuration

```bash
MCP_RESOURCE_STORAGE=memory|filesystem  # Default: memory
MCP_RESOURCE_FILESYSTEM_ROOT=/path      # Filesystem only
```

## Memory Storage

**Default backend**: Fast, no disk I/O, cleared on restart

**Storage**: JavaScript `Map<uri, CachedResource>`
**URIs**: Timestamp-based: `pulse-fetch://scraped/{timestamp}`
**Lookups**: O(n) scan through all resources

**Pros**: Fast, simple, no disk space
**Cons**: Lost on restart, memory-limited

## Filesystem Storage

**Opt-in backend**: Persistent, survives restarts

**Structure**:

```
/storage-root/
  raw/
    example.com-abc123.json
  cleaned/
    example.com-abc123.json
  extracted/
    example.com-abc123.json
```

**Tiers**:

- **raw** - Original fetched content
- **cleaned** - HTML-to-Markdown converted
- **extracted** - LLM-extracted data

**URIs**: `pulse-fetch://scraped/raw/example.com-abc123`

**Filename**: `{domain}-{hash}.json` (URL hash for uniqueness)

## Factory Pattern

**Singleton**: `ResourceStorageFactory` maintains single instance.
**Reset in tests**: `ResourceStorageFactory.reset()` clears singleton.

## Multi-Tier Storage

**saveMulti()**: Atomic write of raw + cleaned + extracted.
All three use same base filename for correlation.

## Cache Lookups

**By URL**: Find most recent scrape of URL
**By URL + Extract Query**: Find cached extraction for specific query

Cache keys include extract query to prevent wrong cached results.

## Testing

**CRITICAL**: `ResourceStorageFactory.reset()` in `beforeEach`
Tests: [../../tests/storage/\*.test.ts](../../tests/storage/)
