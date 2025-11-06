#!/usr/bin/env node
/**
 * Check docstring coverage across TypeScript files
 *
 * Scans for exported functions, classes, interfaces, and types
 * without JSDoc documentation and reports coverage percentage.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface FileStats {
  file: string;
  totalExports: number;
  documentedExports: number;
  coverage: number;
}

/**
 * Check if a line contains a JSDoc comment start
 */
function hasJSDoc(lines: string[], index: number): boolean {
  // Look backwards from the export line for JSDoc (up to 30 lines to handle interfaces/types)
  for (let i = index - 1; i >= Math.max(0, index - 30); i--) {
    const line = lines[i].trim();
    if (line.startsWith('/**') && !line.includes('@fileoverview')) {
      return true;
    }
    // Stop if we hit another export
    if (line.startsWith('export') && i < index - 1) {
      break;
    }
  }
  return false;
}

/**
 * Count exports and documented exports in a TypeScript file
 */
function analyzeFile(filePath: string): FileStats {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let totalExports = 0;
  let documentedExports = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match various export patterns
    if (
      line.startsWith('export function') ||
      line.startsWith('export class') ||
      line.startsWith('export interface') ||
      line.startsWith('export type') ||
      line.startsWith('export enum') ||
      line.startsWith('export const') && (
        line.includes('function') ||
        line.includes(': ') ||
        line.includes('= {')
      )
    ) {
      totalExports++;
      if (hasJSDoc(lines, i)) {
        documentedExports++;
      }
    }
  }

  return {
    file: filePath,
    totalExports,
    documentedExports,
    coverage: totalExports > 0 ? (documentedExports / totalExports) * 100 : 100,
  };
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTypeScriptFiles(dir: string, exclude: string[] = []): string[] {
  const files: string[] = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);

      // Skip excluded directories
      if (exclude.some(ex => fullPath.includes(ex))) {
        continue;
      }

      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findTypeScriptFiles(fullPath, exclude));
      } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Ignore errors for directories we can't read
  }

  return files;
}

/**
 * Main execution
 */
function main() {
  const projectRoot = process.cwd();
  const exclude = [
    'node_modules',
    'dist',
    '.test.',
    '.spec.',
    'tests/',
    '__tests__',
  ];

  console.log('Docstring Coverage Report');
  console.log('=========================\n');

  const files = findTypeScriptFiles(projectRoot, exclude);
  const stats = files.map(analyzeFile);

  const totalExports = stats.reduce((sum, s) => sum + s.totalExports, 0);
  const documentedExports = stats.reduce((sum, s) => sum + s.documentedExports, 0);
  const overallCoverage = totalExports > 0 ? (documentedExports / totalExports) * 100 : 100;

  console.log(`Total exports: ${totalExports}`);
  console.log(`Documented: ${documentedExports}`);
  console.log(`Coverage: ${overallCoverage.toFixed(1)}%\n`);

  // Show files needing attention (below 80% coverage)
  const needsAttention = stats.filter(s => s.coverage < 80 && s.totalExports > 0);

  if (needsAttention.length > 0) {
    console.log('Files needing attention (below 80% coverage):');
    needsAttention
      .sort((a, b) => a.coverage - b.coverage)
      .forEach(s => {
        const relativePath = s.file.replace(projectRoot + '/', '');
        console.log(`- ${relativePath}: ${s.documentedExports}/${s.totalExports} (${s.coverage.toFixed(0)}%)`);
      });
  } else {
    console.log('✅ All files meet the 80% coverage threshold!');
  }

  // Exit with error code if below 80%
  if (overallCoverage < 80) {
    console.log(`\n❌ Overall coverage (${overallCoverage.toFixed(1)}%) is below 80% threshold`);
    process.exit(1);
  } else {
    console.log(`\n✅ Overall coverage (${overallCoverage.toFixed(1)}%) meets 80% threshold`);
    process.exit(0);
  }
}

main();
