import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
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
 * Filesystem resource storage backend
 */
export class FileSystemResourceStorage implements ResourceStorage {
  private rootDir: string;

  constructor(rootDir?: string) {
    this.rootDir = rootDir || path.join(os.tmpdir(), 'pulse-crawl', 'resources');
  }

  async init(): Promise<void> {
    // Create root directory and subdirectories
    await fs.mkdir(this.rootDir, { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'cleaned'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'extracted'), { recursive: true });
  }

  /**
   * Generate a filename from URL
   */
  private generateFilename(url: string): string {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const pathPart = urlObj.pathname
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/\.[^.]+$/, '');
    const identifier = pathPart || 'index';
    const timestamp = Date.now();
    return `${domain}_${identifier}_${timestamp}.md`;
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
    return `${domain}_${identifier}_${timestamp}.md`;
  }

  /**
   * Escape value for YAML frontmatter
   */
  private escapeYamlValue(value: unknown): string {
    if (value === undefined || value === null) {
      return 'null';
    }
    const str = String(value);
    // If contains special characters, wrap in quotes and escape existing quotes
    if (str.includes('"') || str.includes('\n') || str.includes(':')) {
      return `"${str.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return `"${str}"`;
  }

  /**
   * Create markdown file with frontmatter
   */
  private createMarkdown(content: string, metadata: ResourceMetadata): string {
    const frontmatter: string[] = ['---'];

    // Add metadata fields
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        frontmatter.push(`${key}: ${this.escapeYamlValue(value)}`);
      }
    });

    frontmatter.push('---');
    frontmatter.push(content);

    return frontmatter.join('\n');
  }

  /**
   * Parse markdown file with frontmatter
   */
  private parseMarkdown(markdown: string): { content: string; metadata: ResourceMetadata } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);

    if (!match) {
      throw new Error('Invalid markdown format: missing frontmatter');
    }

    const [, frontmatterStr, content] = match;
    const metadata: ResourceMetadata = {
      url: '',
      timestamp: '',
    };

    // Parse frontmatter
    frontmatterStr.split('\n').forEach((line) => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
          // Unescape
          value = value.replace(/\\"/g, '"').replace(/\\n/g, '\n');
        }

        metadata[key] = value;
      }
    });

    return { content, metadata };
  }

  async write(url: string, content: string, options?: WriteOptions): Promise<string> {
    const resourceType = options?.resourceType || 'raw';
    const filename = this.generateFilename(url);
    const subDir = path.join(this.rootDir, resourceType);
    const filePath = path.join(subDir, filename);

    // Ensure directory exists
    await fs.mkdir(subDir, { recursive: true });

    const metadata: ResourceMetadata = {
      url,
      timestamp: new Date().toISOString(),
      resourceType,
      ...options,
    };

    const markdown = this.createMarkdown(content, metadata);
    await fs.writeFile(filePath, markdown, 'utf-8');

    return `file://${filePath}`;
  }

  async writeMulti(options: WriteMultiOptions): Promise<WriteMultiResult> {
    const { url, raw, cleaned, extracted, metadata = {} } = options;
    const sharedFilename = this.generateSharedFilename(url);

    const result: WriteMultiResult = {
      raw: '',
    };

    // Ensure directories exist
    await fs.mkdir(path.join(this.rootDir, 'raw'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'cleaned'), { recursive: true });
    await fs.mkdir(path.join(this.rootDir, 'extracted'), { recursive: true });

    // Write raw content
    const rawPath = path.join(this.rootDir, 'raw', sharedFilename);
    const rawMetadata: ResourceMetadata = {
      url,
      timestamp: new Date().toISOString(),
      resourceType: 'raw',
      source: metadata.source,
    };
    await fs.writeFile(rawPath, this.createMarkdown(raw, rawMetadata), 'utf-8');
    result.raw = `file://${rawPath}`;

    // Write cleaned content if provided
    if (cleaned !== undefined) {
      const cleanedPath = path.join(this.rootDir, 'cleaned', sharedFilename);
      const cleanedMetadata: ResourceMetadata = {
        url,
        timestamp: new Date().toISOString(),
        resourceType: 'cleaned',
        source: metadata.source,
      };
      await fs.writeFile(cleanedPath, this.createMarkdown(cleaned, cleanedMetadata), 'utf-8');
      result.cleaned = `file://${cleanedPath}`;
    }

    // Write extracted content if provided
    if (extracted !== undefined) {
      const extractedPath = path.join(this.rootDir, 'extracted', sharedFilename);
      const extractedMetadata: ResourceMetadata = {
        url,
        timestamp: new Date().toISOString(),
        resourceType: 'extracted',
        source: metadata.source,
        extractionPrompt: metadata.extract,
      };
      await fs.writeFile(extractedPath, this.createMarkdown(extracted, extractedMetadata), 'utf-8');
      result.extracted = `file://${extractedPath}`;
    }

    return result;
  }

  async list(): Promise<Resource[]> {
    const resources: Resource[] = [];

    // Read from all subdirectories
    const subdirs: ResourceType[] = ['raw', 'cleaned', 'extracted'];

    for (const subdir of subdirs) {
      const dirPath = path.join(this.rootDir, subdir);

      try {
        const files = await fs.readdir(dirPath);

        for (const file of files) {
          if (!file.endsWith('.md')) continue;

          const filePath = path.join(dirPath, file);
          try {
            const content = await fs.readFile(filePath, 'utf-8');
            const { content: text, metadata } = this.parseMarkdown(content);

            resources.push({
              uri: `file://${filePath}`,
              name: `Scraped: ${new URL(metadata.url).hostname}`,
              mimeType: metadata.contentType || 'text/plain',
              text,
              metadata,
            });
          } catch (error) {
            // Skip files that can't be parsed
            console.warn(`Failed to parse ${filePath}:`, error);
          }
        }
      } catch (error) {
        // Directory doesn't exist yet
      }
    }

    return resources;
  }

  async read(uri: string): Promise<Resource> {
    if (!uri.startsWith('file://')) {
      throw new Error(`Invalid file URI: ${uri}`);
    }

    const filePath = uri.substring(7); // Remove 'file://'

    try {
      const markdown = await fs.readFile(filePath, 'utf-8');
      const { content, metadata } = this.parseMarkdown(markdown);

      return {
        uri,
        name: `Scraped: ${new URL(metadata.url).hostname}`,
        mimeType: metadata.contentType || 'text/plain',
        text: content,
        metadata,
      };
    } catch (error) {
      throw new Error(`Resource not found: ${uri}`);
    }
  }

  async exists(uri: string): Promise<boolean> {
    if (!uri.startsWith('file://')) {
      return false;
    }

    const filePath = uri.substring(7);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(uri: string): Promise<void> {
    if (!uri.startsWith('file://')) {
      throw new Error(`Invalid file URI: ${uri}`);
    }

    const filePath = uri.substring(7);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw new Error(`Resource not found: ${uri}`);
    }
  }

  async findByUrl(url: string): Promise<Resource[]> {
    const allResources = await this.list();
    const resources = allResources.filter((resource) => resource.metadata.url === url);

    // Sort by timestamp descending (newest first)
    return resources.sort((a, b) => {
      const timeA = new Date(a.metadata.timestamp).getTime();
      const timeB = new Date(b.metadata.timestamp).getTime();
      return timeB - timeA;
    });
  }

  async findByUrlAndExtract(url: string, extract: string): Promise<Resource[]> {
    const allResources = await this.list();
    const resources = allResources.filter(
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
