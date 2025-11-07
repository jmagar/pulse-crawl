/**
 * Types and interfaces for resource storage
 */

/**
 * Resource type identifier
 */
export type ResourceType = 'raw' | 'cleaned' | 'extracted';

/**
 * Metadata for stored resources
 */
export interface ResourceMetadata {
  /** The original URL that was scraped */
  url: string;
  /** When the resource was created */
  timestamp: string;
  /** Last time the resource was accessed (for LRU) */
  lastAccessTime: number;
  /** Time-to-live in milliseconds (0 = infinite) */
  ttl?: number;
  /** Type of resource content */
  resourceType?: ResourceType;
  /** Optional title */
  title?: string;
  /** Optional description */
  description?: string;
  /** Content type / MIME type */
  contentType?: string;
  /** Source scraping service */
  source?: string;
  /** Extraction prompt used (for extracted resources) */
  extractionPrompt?: string;
  /** Additional metadata */
  [key: string]: unknown;
}

/**
 * Stored resource with content and metadata
 */
export interface StoredResource {
  /** Resource URI */
  uri: string;
  /** Resource name/title */
  name: string;
  /** Resource text content */
  text: string;
  /** MIME type */
  mimeType?: string;
  /** Resource metadata */
  metadata: ResourceMetadata;
}

/**
 * Result of writeMulti operation
 */
export interface WriteMultiResult {
  /** URI of raw content */
  raw: string;
  /** URI of cleaned content (optional) */
  cleaned?: string;
  /** URI of extracted content (optional) */
  extracted?: string;
}

/**
 * Parameters for writeMulti operation
 */
export interface WriteMultiParams {
  /** The URL being scraped */
  url: string;
  /** Raw HTML/content */
  raw: string;
  /** Cleaned/filtered content (optional) */
  cleaned?: string;
  /** Extracted content (optional) */
  extracted?: string;
  /** Additional metadata */
  metadata?: Partial<ResourceMetadata>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of items in cache */
  itemCount: number;
  /** Total size in bytes */
  totalSizeBytes: number;
  /** Maximum number of items allowed */
  maxItems: number;
  /** Maximum size in bytes allowed */
  maxSizeBytes: number;
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** List of resources with metadata */
  resources: Array<{
    uri: string;
    url: string;
    sizeBytes: number;
    timestamp: string;
    lastAccessTime: number;
    ttl: number;
    resourceType?: ResourceType;
  }>;
}

/**
 * Storage configuration options
 */
export interface StorageOptions {
  /** Default TTL in milliseconds (0 = infinite) */
  defaultTTL?: number;
  /** Maximum number of cached items */
  maxItems?: number;
  /** Maximum cache size in bytes */
  maxSizeBytes?: number;
  /** Cleanup interval in milliseconds */
  cleanupInterval?: number;
}

/**
 * Resource storage interface
 */
export interface ResourceStorage {
  /**
   * Initialize the storage (e.g., create directories)
   */
  init?(): Promise<void>;

  /**
   * Write a resource to storage
   * @param url The source URL
   * @param content The content to store
   * @param metadata Optional metadata
   * @returns URI of the stored resource
   */
  write(url: string, content: string, metadata?: Partial<ResourceMetadata>): Promise<string>;

  /**
   * Write multiple resource types (raw, cleaned, extracted) at once
   * @param params Write parameters
   * @returns URIs for each written resource
   */
  writeMulti(params: WriteMultiParams): Promise<WriteMultiResult>;

  /**
   * Read a resource from storage
   * @param uri Resource URI
   * @returns The stored resource
   */
  read(uri: string): Promise<StoredResource>;

  /**
   * Check if a resource exists
   * @param uri Resource URI
   * @returns true if exists
   */
  exists(uri: string): Promise<boolean>;

  /**
   * Delete a resource
   * @param uri Resource URI
   */
  delete(uri: string): Promise<void>;

  /**
   * List all stored resources
   * @returns Array of stored resources
   */
  list(): Promise<StoredResource[]>;

  /**
   * Find resources by URL
   * @param url The URL to search for
   * @returns Array of resources with matching URL, sorted by timestamp descending
   */
  findByUrl(url: string): Promise<StoredResource[]>;

  /**
   * Find resources by URL and extract prompt
   * @param url The URL to search for
   * @param extractPrompt The extraction prompt (optional - if omitted, returns resources without extractionPrompt)
   * @returns Array of matching resources, sorted by timestamp descending
   */
  findByUrlAndExtract?(url: string, extractPrompt?: string): Promise<StoredResource[]>;

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): Promise<CacheStats>;

  /**
   * Get cache statistics synchronously (if available)
   * @returns Cache statistics
   */
  getStatsSync?(): CacheStats;

  /**
   * Start background cleanup task
   */
  startCleanup?(): void;

  /**
   * Stop background cleanup task
   */
  stopCleanup?(): void;

  /**
   * Manually run cleanup (evict expired/excess items)
   */
  cleanup?(): Promise<void>;

  /**
   * Evict a specific resource
   * @param uri Resource URI
   */
  evict?(uri: string): Promise<void>;
}
