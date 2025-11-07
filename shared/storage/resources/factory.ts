/**
 * Factory for creating resource storage instances
 */

import type { ResourceStorage } from './types.js';
import { MemoryResourceStorage } from './backends/memory.js';
import { FileSystemResourceStorage } from './backends/filesystem.js';

export class ResourceStorageFactory {
  private static instance: ResourceStorage | null = null;

  /**
   * Create or get the singleton storage instance
   */
  static async create(): Promise<ResourceStorage> {
    if (this.instance) {
      return this.instance;
    }

    const storageType = (process.env.MCP_RESOURCE_STORAGE || 'memory').toLowerCase();

    switch (storageType) {
      case 'memory': {
        this.instance = new MemoryResourceStorage();
        break;
      }

      case 'filesystem': {
        const storage = new FileSystemResourceStorage();
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
   * Reset the singleton instance (useful for testing)
   */
  static reset(): void {
    // Stop cleanup if running
    if (this.instance?.stopCleanup) {
      this.instance.stopCleanup();
    }
    this.instance = null;
  }
}
