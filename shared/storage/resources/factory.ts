import { MemoryResourceStorage } from './backends/memory.js';
import { FileSystemResourceStorage } from './backends/filesystem.js';
import type { ResourceStorage } from './types.js';

/**
 * Factory for creating resource storage instances
 */
export class ResourceStorageFactory {
  private static instance: ResourceStorage | null = null;

  /**
   * Create or return the singleton storage instance
   */
  static async create(): Promise<ResourceStorage> {
    if (this.instance) {
      return this.instance;
    }

    const storageType = (process.env.MCP_RESOURCE_STORAGE || 'memory').toLowerCase();

    switch (storageType) {
      case 'memory':
        this.instance = new MemoryResourceStorage();
        break;

      case 'filesystem': {
        const rootDir = process.env.MCP_RESOURCE_FILESYSTEM_ROOT;
        const storage = new FileSystemResourceStorage(rootDir);
        await storage.init();
        this.instance = storage;
        break;
      }

      default:
        throw new Error(
          `Unsupported storage type: ${storageType}. Supported types: memory, filesystem`
        );
    }

    return this.instance;
  }

  /**
   * Reset the singleton instance (mainly for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
