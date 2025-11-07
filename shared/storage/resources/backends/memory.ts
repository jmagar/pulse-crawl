/**
 * Memory-based resource storage with TTL and LRU eviction
 */

import type {
  ResourceStorage,
  ResourceMetadata,
  StoredResource,
  WriteMultiParams,
  WriteMultiResult,
  CacheStats,
  StorageOptions,
} from '../types.js';

interface CacheEntry {
  resource: StoredResource;
  sizeBytes: number;
  expiresAt: number; // 0 = never expires
}

export class MemoryResourceStorage implements ResourceStorage {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly defaultTTL: number;
  private readonly maxItems: number;
  private readonly maxSizeBytes: number;
  private readonly cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(options: StorageOptions = {}) {
    // Read from environment variables with defaults
    const envTTL = process.env.MCP_RESOURCE_TTL
      ? parseInt(process.env.MCP_RESOURCE_TTL, 10)
      : 86400; // 24 hours in seconds
    const envMaxSize = process.env.MCP_RESOURCE_MAX_SIZE
      ? parseInt(process.env.MCP_RESOURCE_MAX_SIZE, 10)
      : 100; // 100 MB
    const envMaxItems = process.env.MCP_RESOURCE_MAX_ITEMS
      ? parseInt(process.env.MCP_RESOURCE_MAX_ITEMS, 10)
      : 1000;

    this.defaultTTL = options.defaultTTL ?? envTTL * 1000; // Convert to milliseconds
    this.maxItems = options.maxItems ?? envMaxItems;
    this.maxSizeBytes = options.maxSizeBytes ?? envMaxSize * 1024 * 1024; // Convert to bytes
    this.cleanupInterval = options.cleanupInterval ?? 60000; // 1 minute default
  }

  private generateUri(url: string, resourceType: string = 'raw'): string {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '_');
    const pathname = urlObj.pathname.replace(/\//g, '_');
    const timestamp = Date.now();
    return `memory://${resourceType}/${hostname}${pathname}_${timestamp}`;
  }

  private calculateSize(resource: StoredResource): number {
    // Approximate size calculation
    return (
      Buffer.byteLength(resource.text, 'utf8') +
      Buffer.byteLength(JSON.stringify(resource.metadata), 'utf8')
    );
  }

  private isExpired(entry: CacheEntry): boolean {
    if (entry.expiresAt === 0) return false; // Never expires
    return Date.now() >= entry.expiresAt;
  }

  private evictExpired(): void {
    for (const [uri, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(uri);
      }
    }
  }

  private evictLRU(): void {
    // Calculate current size and count
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.sizeBytes;
    }

    // Evict based on count limit
    while (this.cache.size > this.maxItems) {
      // Find least recently used (oldest lastAccessTime)
      let lruUri: string | null = null;
      let lruTime = Infinity;

      for (const [uri, entry] of this.cache.entries()) {
        if (entry.resource.metadata.lastAccessTime < lruTime) {
          lruTime = entry.resource.metadata.lastAccessTime;
          lruUri = uri;
        }
      }

      if (lruUri) {
        const entry = this.cache.get(lruUri)!;
        totalSize -= entry.sizeBytes;
        this.cache.delete(lruUri);
      } else {
        break;
      }
    }

    // Evict based on size limit
    while (totalSize > this.maxSizeBytes && this.cache.size > 0) {
      // Find least recently used
      let lruUri: string | null = null;
      let lruTime = Infinity;

      for (const [uri, entry] of this.cache.entries()) {
        if (entry.resource.metadata.lastAccessTime < lruTime) {
          lruTime = entry.resource.metadata.lastAccessTime;
          lruUri = uri;
        }
      }

      if (lruUri) {
        const entry = this.cache.get(lruUri)!;
        totalSize -= entry.sizeBytes;
        this.cache.delete(lruUri);
      } else {
        break;
      }
    }
  }

  async write(url: string, content: string, metadata: Partial<ResourceMetadata> = {}): Promise<string> {
    const resourceType = metadata.resourceType || 'raw';
    const uri = this.generateUri(url, resourceType);
    const now = Date.now();
    const ttl = metadata.ttl !== undefined ? metadata.ttl : this.defaultTTL;

    const resource: StoredResource = {
      uri,
      name: metadata.title || `Scraped: ${url}`,
      text: content,
      mimeType: metadata.contentType || 'text/plain',
      metadata: {
        url,
        timestamp: new Date(now).toISOString(),
        lastAccessTime: now,
        ttl,
        resourceType,
        ...metadata,
      },
    };

    const entry: CacheEntry = {
      resource,
      sizeBytes: this.calculateSize(resource),
      expiresAt: ttl === 0 ? 0 : now + ttl,
    };

    // Add to cache (Map maintains insertion order)
    this.cache.set(uri, entry);

    // Evict if necessary
    this.evictLRU();

    return uri;
  }

  async writeMulti(params: WriteMultiParams): Promise<WriteMultiResult> {
    const baseMetadata = params.metadata || {};
    const result: WriteMultiResult = {
      raw: '',
    };

    // Write raw content
    result.raw = await this.write(params.url, params.raw, {
      ...baseMetadata,
      resourceType: 'raw',
    });

    // Write cleaned content if provided
    if (params.cleaned) {
      result.cleaned = await this.write(params.url, params.cleaned, {
        ...baseMetadata,
        resourceType: 'cleaned',
      });
    }

    // Write extracted content if provided
    if (params.extracted) {
      result.extracted = await this.write(params.url, params.extracted, {
        ...baseMetadata,
        resourceType: 'extracted',
        extractionPrompt: baseMetadata.extract as string | undefined,
      });
    }

    return result;
  }

  async read(uri: string): Promise<StoredResource> {
    const entry = this.cache.get(uri);

    if (!entry) {
      throw new Error('Resource not found');
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(uri);
      throw new Error('Resource not found');
    }

    // Update last access time (for LRU)
    entry.resource.metadata.lastAccessTime = Date.now();

    return entry.resource;
  }

  async exists(uri: string): Promise<boolean> {
    const entry = this.cache.get(uri);

    if (!entry) {
      return false;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(uri);
      return false;
    }

    return true;
  }

  async delete(uri: string): Promise<void> {
    if (!this.cache.has(uri)) {
      throw new Error('Resource not found');
    }

    this.cache.delete(uri);
  }

  async list(): Promise<StoredResource[]> {
    this.evictExpired();

    const resources: StoredResource[] = [];
    for (const entry of this.cache.values()) {
      if (!this.isExpired(entry)) {
        resources.push(entry.resource);
      }
    }

    return resources;
  }

  async findByUrl(url: string): Promise<StoredResource[]> {
    this.evictExpired();

    const resources: StoredResource[] = [];
    for (const entry of this.cache.values()) {
      if (!this.isExpired(entry) && entry.resource.metadata.url === url) {
        resources.push(entry.resource);
      }
    }

    // Sort by timestamp descending (newest first)
    return resources.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }

  async findByUrlAndExtract(url: string, extractPrompt?: string): Promise<StoredResource[]> {
    this.evictExpired();

    const resources: StoredResource[] = [];

    for (const entry of this.cache.values()) {
      if (!this.isExpired(entry) && entry.resource.metadata.url === url) {
        // If extractPrompt is provided, match extracted resources with that prompt
        if (extractPrompt !== undefined) {
          if (
            entry.resource.metadata.extractionPrompt === extractPrompt &&
            entry.resource.metadata.resourceType === 'extracted'
          ) {
            resources.push(entry.resource);
          }
        } else {
          // If no extractPrompt provided, return resources without extractionPrompt
          if (!entry.resource.metadata.extractionPrompt) {
            resources.push(entry.resource);
          }
        }
      }
    }

    // Sort by timestamp descending (newest first)
    return resources.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }

  async getStats(): Promise<CacheStats> {
    return this.getStatsSync();
  }

  getStatsSync(): CacheStats {
    this.evictExpired();

    let totalSize = 0;
    const resources: CacheStats['resources'] = [];

    for (const [uri, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        totalSize += entry.sizeBytes;
        resources.push({
          uri,
          url: entry.resource.metadata.url,
          sizeBytes: entry.sizeBytes,
          timestamp: entry.resource.metadata.timestamp,
          lastAccessTime: entry.resource.metadata.lastAccessTime,
          ttl: entry.resource.metadata.ttl || 0,
          resourceType: entry.resource.metadata.resourceType,
        });
      }
    }

    return {
      itemCount: this.cache.size,
      totalSizeBytes: totalSize,
      maxItems: this.maxItems,
      maxSizeBytes: this.maxSizeBytes,
      defaultTTL: this.defaultTTL,
      resources,
    };
  }

  startCleanup(): void {
    if (this.cleanupTimer) {
      return; // Already running
    }

    this.cleanupTimer = setInterval(() => {
      this.evictExpired();
      this.evictLRU();
    }, this.cleanupInterval);
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  async cleanup(): Promise<void> {
    this.evictExpired();
    this.evictLRU();
  }

  async evict(uri: string): Promise<void> {
    this.cache.delete(uri);
  }
}
