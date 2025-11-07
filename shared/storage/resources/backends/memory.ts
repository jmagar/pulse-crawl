import type {
  Resource,
  ResourceStorage,
  ResourceMetadata,
  WriteOptions,
  WriteMultiOptions,
  WriteMultiResult,
  ResourceType,
} from '../types.js';

/**
 * In-memory resource storage backend
 */
export class MemoryResourceStorage implements ResourceStorage {
  private resources: Map<string, Resource> = new Map();

  /**
   * Generate a unique URI for a resource
   */
  private generateUri(url: string, resourceType: ResourceType = 'raw'): string {
    // Extract domain and path from URL for a readable URI
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const pathPart = urlObj.pathname
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/\.[^.]+$/, '');
    const identifier = pathPart || 'index';

    // Use timestamp for uniqueness
    const timestamp = Date.now();
    const filename = `${domain}_${identifier}_${timestamp}`;

    return `memory://${resourceType}/${filename}`;
  }

  /**
   * Generate a shared filename for multi-tier writes
   */
  private generateSharedFilename(url: string): string {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const pathPart = urlObj.pathname
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/\.[^.]+$/, '');
    const identifier = pathPart || 'index';
    const timestamp = Date.now();
    return `${domain}_${identifier}_${timestamp}`;
  }

  async write(url: string, content: string, options?: WriteOptions): Promise<string> {
    const resourceType = options?.resourceType || 'raw';
    const uri = this.generateUri(url, resourceType);

    const metadata: ResourceMetadata = {
      url,
      timestamp: new Date().toISOString(),
      resourceType,
      ...options,
    };

    const resource: Resource = {
      uri,
      name: `Scraped: ${new URL(url).hostname}`,
      mimeType: options?.contentType || 'text/plain',
      text: content,
      metadata,
    };

    this.resources.set(uri, resource);
    return uri;
  }

  async writeMulti(options: WriteMultiOptions): Promise<WriteMultiResult> {
    const { url, raw, cleaned, extracted, metadata = {} } = options;
    const sharedFilename = this.generateSharedFilename(url);

    const result: WriteMultiResult = {
      raw: '',
    };

    // Write raw content
    const rawUri = `memory://raw/${sharedFilename}`;
    const rawMetadata: ResourceMetadata = {
      url,
      timestamp: new Date().toISOString(),
      resourceType: 'raw',
      source: metadata.source,
    };
    this.resources.set(rawUri, {
      uri: rawUri,
      name: `Scraped: ${new URL(url).hostname}`,
      mimeType: 'text/plain',
      text: raw,
      metadata: rawMetadata,
    });
    result.raw = rawUri;

    // Write cleaned content if provided
    if (cleaned !== undefined) {
      const cleanedUri = `memory://cleaned/${sharedFilename}`;
      const cleanedMetadata: ResourceMetadata = {
        url,
        timestamp: new Date().toISOString(),
        resourceType: 'cleaned',
        source: metadata.source,
      };
      this.resources.set(cleanedUri, {
        uri: cleanedUri,
        name: `Cleaned: ${new URL(url).hostname}`,
        mimeType: 'text/markdown',
        text: cleaned,
        metadata: cleanedMetadata,
      });
      result.cleaned = cleanedUri;
    }

    // Write extracted content if provided
    if (extracted !== undefined) {
      const extractedUri = `memory://extracted/${sharedFilename}`;
      const extractedMetadata: ResourceMetadata = {
        url,
        timestamp: new Date().toISOString(),
        resourceType: 'extracted',
        source: metadata.source,
        extractionPrompt: metadata.extract,
      };
      this.resources.set(extractedUri, {
        uri: extractedUri,
        name: `Extracted: ${new URL(url).hostname}`,
        mimeType: 'text/plain',
        text: extracted,
        metadata: extractedMetadata,
      });
      result.extracted = extractedUri;
    }

    return result;
  }

  async list(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async read(uri: string): Promise<Resource> {
    const resource = this.resources.get(uri);
    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }
    return resource;
  }

  async exists(uri: string): Promise<boolean> {
    return this.resources.has(uri);
  }

  async delete(uri: string): Promise<void> {
    if (!this.resources.has(uri)) {
      throw new Error(`Resource not found: ${uri}`);
    }
    this.resources.delete(uri);
  }

  async findByUrl(url: string): Promise<Resource[]> {
    const resources = Array.from(this.resources.values()).filter(
      (resource) => resource.metadata.url === url
    );

    // Sort by timestamp descending (newest first)
    return resources.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }

  async findByUrlAndExtract(url: string, extract: string): Promise<Resource[]> {
    const resources = Array.from(this.resources.values()).filter(
      (resource) => resource.metadata.url === url && resource.metadata.extractionPrompt === extract
    );

    // Sort by timestamp descending (newest first)
    return resources.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }
}
