/**
 * Filesystem-based resource storage with TTL and size limits
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import type {
  ResourceStorage,
  ResourceMetadata,
  StoredResource,
  WriteMultiParams,
  WriteMultiResult,
  CacheStats,
  StorageOptions,
  ResourceType,
} from '../types.js';

interface ParsedMarkdown {
  metadata: ResourceMetadata;
  content: string;
}

export class FileSystemResourceStorage implements ResourceStorage {
  private readonly rootDir: string;
  private readonly defaultTTL: number;
  private readonly maxItems: number;
  private readonly maxSizeBytes: number;
  private readonly cleanupInterval: number;
  private cleanupTimer?: NodeJS.Timeout;
  private initialized: boolean = false;

  constructor(rootDir?: string, options: StorageOptions = {}) {
    // Read from environment variables with defaults
    const envRoot = process.env.MCP_RESOURCE_FILESYSTEM_ROOT;
    const envTTL = process.env.MCP_RESOURCE_TTL
      ? parseInt(process.env.MCP_RESOURCE_TTL, 10)
      : 86400;
    const envMaxSize = process.env.MCP_RESOURCE_MAX_SIZE
      ? parseInt(process.env.MCP_RESOURCE_MAX_SIZE, 10)
      : 100;
    const envMaxItems = process.env.MCP_RESOURCE_MAX_ITEMS
      ? parseInt(process.env.MCP_RESOURCE_MAX_ITEMS, 10)
      : 1000;

    this.rootDir = rootDir || envRoot || path.join(os.tmpdir(), 'pulse-crawl', 'resources');
    this.defaultTTL = options.defaultTTL ?? envTTL * 1000;
    this.maxItems = options.maxItems ?? envMaxItems;
    this.maxSizeBytes = options.maxSizeBytes ?? envMaxSize * 1024 * 1024;
    this.cleanupInterval = options.cleanupInterval ?? 60000;
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Create root directory and subdirectories
    await fs.mkdir(path.join(this.rootDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'cleaned'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'extracted'), { recursive: true });

    this.initialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }

  private generateFilename(url: string): string {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/\./g, '_');
    const pathname = urlObj.pathname.replace(/\//g, '_');
    const timestamp = Date.now();
    return `${hostname}${pathname}_${timestamp}.md`;
  }

  private getSubdirectory(resourceType: ResourceType = 'raw'): string {
    return path.join(this.rootDir, resourceType);
  }

  private createMarkdown(content: string, metadata: ResourceMetadata): string {
    const frontmatter = Object.entries(metadata)
      .map(([key, value]) => {
        if (value === undefined || value === null) return '';
        if (typeof value === 'string') {
          // Escape quotes and newlines in strings
          const escaped = value.replace(/"/g, '\\"').replace(/\n/g, '\\n');
          return `${key}: "${escaped}"`;
        }
        return `${key}: ${JSON.stringify(value)}`;
      })
      .filter(Boolean)
      .join('\n');

    return `---\n${frontmatter}\n---\n\n${content}`;
  }

  private parseMarkdown(markdown: string): ParsedMarkdown {
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]*)$/);

    if (!frontmatterMatch) {
      throw new Error('Invalid markdown format');
    }

    const [, frontmatterStr, content] = frontmatterMatch;
    const metadata: Partial<ResourceMetadata> = {};

    for (const line of frontmatterStr.split('\n')) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      const valueStr = line.substring(colonIndex + 1).trim();

      try {
        // Try to parse as JSON first
        const value = JSON.parse(valueStr);
        metadata[key as keyof ResourceMetadata] = value as never;
      } catch {
        // If JSON parse fails, treat as string (removing quotes if present)
        const unquoted = valueStr.replace(/^"(.*)"$/, '$1');
        // Unescape
        const unescaped = unquoted.replace(/\\n/g, '\n').replace(/\\"/g, '"');
        metadata[key as keyof ResourceMetadata] = unescaped as never;
      }
    }

    return {
      metadata: metadata as ResourceMetadata,
      content,
    };
  }

  private isExpired(metadata: ResourceMetadata): boolean {
    const ttl = metadata.ttl ?? this.defaultTTL;
    if (ttl === 0) return false;

    const createdAt = new Date(metadata.timestamp).getTime();
    const expiresAt = createdAt + ttl;
    return Date.now() >= expiresAt;
  }

  async write(url: string, content: string, metadata: Partial<ResourceMetadata> = {}): Promise<string> {
    await this.ensureInitialized();

    const resourceType = (metadata.resourceType || 'raw') as ResourceType;
    const subdir = this.getSubdirectory(resourceType);
    const filename = this.generateFilename(url);
    const filePath = path.join(subdir, filename);

    const now = Date.now();
    const fullMetadata: ResourceMetadata = {
      url,
      timestamp: new Date(now).toISOString(),
      lastAccessTime: now,
      ttl: metadata.ttl !== undefined ? metadata.ttl : this.defaultTTL,
      resourceType,
      ...metadata,
    };

    const markdown = this.createMarkdown(content, fullMetadata);
    await fs.writeFile(filePath, markdown, 'utf-8');

    // Enforce limits after write
    await this.enforceLimits();

    return `file://${filePath}`;
  }

  async writeMulti(params: WriteMultiParams): Promise<WriteMultiResult> {
    await this.ensureInitialized();

    const baseMetadata = params.metadata || {};
    const filename = this.generateFilename(params.url);

    const result: WriteMultiResult = {
      raw: '',
    };

    // Write raw content
    const rawPath = path.join(this.getSubdirectory('raw'), filename);
    const now = Date.now();
    const rawMetadata: ResourceMetadata = {
      url: params.url,
      timestamp: new Date(now).toISOString(),
      lastAccessTime: now,
      ttl: baseMetadata.ttl !== undefined ? baseMetadata.ttl : this.defaultTTL,
      resourceType: 'raw',
      ...baseMetadata,
    };
    await fs.writeFile(rawPath, this.createMarkdown(params.raw, rawMetadata), 'utf-8');
    result.raw = `file://${rawPath}`;

    // Write cleaned content if provided
    if (params.cleaned) {
      const cleanedPath = path.join(this.getSubdirectory('cleaned'), filename);
      const cleanedMetadata: ResourceMetadata = {
        ...rawMetadata,
        resourceType: 'cleaned',
      };
      await fs.writeFile(cleanedPath, this.createMarkdown(params.cleaned, cleanedMetadata), 'utf-8');
      result.cleaned = `file://${cleanedPath}`;
    }

    // Write extracted content if provided
    if (params.extracted) {
      const extractedPath = path.join(this.getSubdirectory('extracted'), filename);
      const extractedMetadata: ResourceMetadata = {
        ...rawMetadata,
        resourceType: 'extracted',
        extractionPrompt: baseMetadata.extractionPrompt,
      };
      await fs.writeFile(extractedPath, this.createMarkdown(params.extracted, extractedMetadata), 'utf-8');
      result.extracted = `file://${extractedPath}`;
    }

    // Enforce limits after write
    await this.enforceLimits();

    return result;
  }

  async read(uri: string): Promise<StoredResource> {
    if (!uri.startsWith('file://')) {
      throw new Error('Invalid file URI');
    }

    const filePath = uri.substring(7);

    try {
      const markdown = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseMarkdown(markdown);

      // Check if expired
      if (this.isExpired(parsed.metadata)) {
        await fs.unlink(filePath).catch(() => {});
        throw new Error('Resource not found');
      }

      // Update last access time
      parsed.metadata.lastAccessTime = Date.now();
      const updatedMarkdown = this.createMarkdown(parsed.content, parsed.metadata);
      await fs.writeFile(filePath, updatedMarkdown, 'utf-8').catch(() => {});

      return {
        uri,
        name: parsed.metadata.title || `Scraped: ${parsed.metadata.url}`,
        text: parsed.content,
        mimeType: parsed.metadata.contentType || 'text/plain',
        metadata: parsed.metadata,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Resource not found');
      }
      throw error;
    }
  }

  async exists(uri: string): Promise<boolean> {
    if (!uri.startsWith('file://')) {
      return false;
    }

    const filePath = uri.substring(7);

    try {
      const markdown = await fs.readFile(filePath, 'utf-8');
      const parsed = this.parseMarkdown(markdown);

      // Check if expired
      if (this.isExpired(parsed.metadata)) {
        await fs.unlink(filePath).catch(() => {});
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  async delete(uri: string): Promise<void> {
    if (!uri.startsWith('file://')) {
      throw new Error('Invalid file URI');
    }

    const filePath = uri.substring(7);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error('Resource not found');
      }
      throw error;
    }
  }

  async list(): Promise<StoredResource[]> {
    const resources: StoredResource[] = [];

    for (const subdir of ['raw', 'cleaned', 'extracted'] as ResourceType[]) {
      const dirPath = this.getSubdirectory(subdir);

      try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(dirPath, file);
          const uri = `file://${filePath}`;

          try {
            const markdown = await fs.readFile(filePath, 'utf-8');
            const parsed = this.parseMarkdown(markdown);

            // Skip expired
            if (this.isExpired(parsed.metadata)) {
              await fs.unlink(filePath).catch(() => {});
              continue;
            }

            resources.push({
              uri,
              name: parsed.metadata.title || `Scraped: ${parsed.metadata.url}`,
              text: parsed.content,
              mimeType: parsed.metadata.contentType || 'text/plain',
              metadata: parsed.metadata,
            });
          } catch {
            // Skip invalid files
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }
    }

    return resources;
  }

  async findByUrl(url: string): Promise<StoredResource[]> {
    const allResources = await this.list();
    const filtered = allResources.filter((r) => r.metadata.url === url);

    // Sort by timestamp descending
    return filtered.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }

  async findByUrlAndExtract(url: string, extractPrompt?: string): Promise<StoredResource[]> {
    const allResources = await this.list();
    const filtered: StoredResource[] = [];

    for (const resource of allResources) {
      if (resource.metadata.url === url) {
        // If extractPrompt is provided, match extracted resources with that prompt
        if (extractPrompt !== undefined) {
          if (
            resource.metadata.extractionPrompt === extractPrompt &&
            resource.metadata.resourceType === 'extracted'
          ) {
            filtered.push(resource);
          }
        } else {
          // If no extractPrompt provided, return resources without extractionPrompt
          if (!resource.metadata.extractionPrompt) {
            filtered.push(resource);
          }
        }
      }
    }

    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }

  async getStats(): Promise<CacheStats> {
    const resources = await this.list();
    let totalSize = 0;

    const statsResources: CacheStats['resources'] = [];

    for (const resource of resources) {
      const filePath = resource.uri.substring(7);
      try {
        const stats = await fs.stat(filePath);
        const sizeBytes = stats.size;
        totalSize += sizeBytes;

        statsResources.push({
          uri: resource.uri,
          url: resource.metadata.url,
          sizeBytes,
          timestamp: resource.metadata.timestamp,
          lastAccessTime: resource.metadata.lastAccessTime,
          ttl: resource.metadata.ttl || 0,
          resourceType: resource.metadata.resourceType,
        });
      } catch {
        // Skip files we can't stat
      }
    }

    return {
      itemCount: resources.length,
      totalSizeBytes: totalSize,
      maxItems: this.maxItems,
      maxSizeBytes: this.maxSizeBytes,
      defaultTTL: this.defaultTTL,
      resources: statsResources,
    };
  }

  private async enforceLimits(): Promise<void> {
    const stats = await this.getStats();

    // Sort resources by last access time (LRU)
    const sortedResources = [...stats.resources].sort(
      (a, b) => a.lastAccessTime - b.lastAccessTime
    );

    let currentCount = stats.itemCount;
    let currentSize = stats.totalSizeBytes;

    // Evict oldest items until within limits
    for (const resource of sortedResources) {
      if (currentCount <= this.maxItems && currentSize <= this.maxSizeBytes) {
        break;
      }

      const filePath = resource.uri.substring(7);
      try {
        await fs.unlink(filePath);
        currentCount--;
        currentSize -= resource.sizeBytes;
      } catch {
        // Failed to delete, continue
      }
    }
  }

  async cleanup(): Promise<void> {
    // Remove expired files
    const allResources = await this.list();

    // Enforce limits
    await this.enforceLimits();
  }

  startCleanup(): void {
    if (this.cleanupTimer) {
      return;
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch(() => {});
    }, this.cleanupInterval);
  }

  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  async evict(uri: string): Promise<void> {
    await this.delete(uri);
  }
}
