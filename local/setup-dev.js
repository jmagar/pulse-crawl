#!/usr/bin/env node
/**
 * Development Setup: Symlink Strategy
 *
 * This script creates a symlink to enable local imports from shared code:
 *
 * Directory structure:
 *   /shared/           - Actual shared package (source + dist/)
 *   /local/shared/     - Symlink → ../shared/dist/
 *
 * Why use a symlink?
 * - Allows imports like: import { foo } from './shared/index.js'
 * - TypeScript rootDir validation works (files appear local)
 * - Avoids relative imports across package boundaries
 *
 * At runtime: local/shared/index.js → (symlink) → shared/dist/index.js
 *
 * For publishing, prepare-publish.js copies the actual files.
 */
import { symlink, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function setupDev() {
  const linkPath = join(__dirname, 'shared');
  const targetPath = join(__dirname, '../shared/dist');

  try {
    await unlink(linkPath);
  } catch (e) {
    // Ignore if doesn't exist
  }

  try {
    await symlink(targetPath, linkPath, 'dir');
    console.log('Created symlink for development');
  } catch (e) {
    console.error('Failed to create symlink:', e.message);
  }
}

setupDev().catch(console.error);
