/**
 * Resource types for multi-tier storage
 */
export type ResourceType = 'raw' | 'cleaned' | 'extracted';

/**
 * Metadata for stored resources
 */
export interface ResourceMetadata {
  url: string;
  timestamp: string;
  contentType?: string;
  title?: string;
  description?: string;
  source?: string;
  resourceType?: ResourceType;
  extractionPrompt?: string;
  [key: string]: unknown;
}

/**
 * Resource data structure
 */
export interface Resource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
  text?: string;
  blob?: string;
  metadata: ResourceMetadata;
}

/**
 * Options for writing a single resource
 */
export interface WriteOptions {
  contentType?: string;
  title?: string;
  description?: string;
  resourceType?: ResourceType;
  [key: string]: unknown;
}

/**
 * Options for writing multiple resource tiers
 */
export interface WriteMultiOptions {
  url: string;
  raw: string;
  cleaned?: string;
  extracted?: string;
  metadata?: {
    source?: string;
    extract?: string;
    [key: string]: unknown;
  };
}

/**
 * Result of writeMulti operation
 */
export interface WriteMultiResult {
  raw: string;
  cleaned?: string;
  extracted?: string;
}

/**
 * Interface for resource storage backends
 */
export interface ResourceStorage {
  /**
   * Initialize the storage backend
   */
  init?(): Promise<void>;

  /**
   * Write a single resource
   */
  write(url: string, content: string, options?: WriteOptions): Promise<string>;

  /**
   * Write multiple resource tiers (raw, cleaned, extracted)
   */
  writeMulti(options: WriteMultiOptions): Promise<WriteMultiResult>;

  /**
   * List all stored resources
   */
  list(): Promise<Resource[]>;

  /**
   * Read a resource by URI
   */
  read(uri: string): Promise<Resource>;

  /**
   * Check if a resource exists
   */
  exists(uri: string): Promise<boolean>;

  /**
   * Delete a resource
   */
  delete(uri: string): Promise<void>;

  /**
   * Find resources by URL
   */
  findByUrl(url: string): Promise<Resource[]>;

  /**
   * Find resources by URL and extraction prompt
   */
  findByUrlAndExtract?(url: string, extract: string): Promise<Resource[]>;
}
