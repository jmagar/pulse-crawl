# Dependency Synchronization

This document describes the dependency synchronization system implemented for the pulse-crawl monorepo.

## Overview

The pulse-crawl monorepo consists of three packages (`shared`, `local`, `remote`) that share many dependencies. To prevent version drift and ensure consistency, we've implemented automated dependency synchronization with test validation and CI enforcement.

## Synchronized Dependencies

### Production Dependencies

All packages use the same versions for these shared dependencies:

| Dependency | Version | Notes |
|------------|---------|-------|
| `@anthropic-ai/sdk` | `^0.68.0` | Latest compatible version |
| `@modelcontextprotocol/sdk` | `^1.19.1` | MCP SDK |
| `dom-to-semantic-markdown` | `^1.5.0` | HTML to Markdown conversion |
| `jsdom` | `^27.1.0` | Latest compatible version |
| `openai` | `^4.104.0` | Using 4.x (6.x has breaking changes) |
| `pdf-parse` | `^1.1.1` | Using 1.x (2.x has different exports) |
| `zod` | `^3.24.1` | Using 3.x (4.x has breaking changes) |
| `dotenv` | `^17.2.3` | Environment variable management |

### Development Dependencies

| Dependency | Version | Notes |
|------------|---------|-------|
| `typescript` | `^5.7.3` | TypeScript compiler |
| `eslint` | `^9.39.1` | Linter |
| `prettier` | `^3.6.2` | Code formatter |
| `typescript-eslint` | `^8.46.3` | TypeScript ESLint plugin |
| `@eslint/js` | `^9.39.1` | ESLint core |
| `@types/node` | `^24.0.0` | Node.js type definitions |
| `vitest` | `^3.2.3` | Test framework |
| `@types/jsdom` | `^21.1.7` | jsdom type definitions |

## Version Selection Strategy

When choosing versions, we prioritize:

1. **Compatibility**: Versions that work with the existing codebase without breaking changes
2. **Consistency**: Same versions across all packages
3. **Stability**: Prefer stable releases over beta/alpha
4. **Latest**: Within compatibility constraints, use the latest version

### Why Not Latest for Everything?

Some packages were intentionally kept at older major versions:

- **zod 3.x vs 4.x**: Zod 4.x introduces breaking changes in the type system that require significant code updates
- **openai 4.x vs 6.x**: OpenAI SDK 6.x has breaking API changes
- **pdf-parse 1.x vs 2.x**: pdf-parse 2.x has different module exports

## Usage

### Synchronize Dependencies

To update all package.json files to use synchronized versions:

```bash
npm run deps:sync
```

This will:
1. Read all package.json files
2. Apply canonical versions from the sync script
3. Update all package.json files
4. Report changes made

After running, you must:
```bash
npm install  # Update package-lock.json
npm run deps:validate  # Verify synchronization
npm test tests/shared/dependency-sync.test.ts  # Run tests
```

### Validate Dependencies

To check if all dependencies are synchronized:

```bash
npm run deps:validate
```

This is run in CI and will fail the build if dependencies drift.

## CI Integration

The `.github/workflows/ci.yml` workflow includes dependency validation:

1. **validate-dependencies** job runs first
2. Fails if dependencies are out of sync
3. Blocks other jobs until dependencies are valid

This prevents:
- Accidentally committing unsynchronized versions
- Version drift over time
- Merge conflicts due to dependency changes

## Test Coverage

### Test File: `tests/shared/dependency-sync.test.ts`

Tests validate:

- Production dependencies match across packages
- Dev dependencies match across packages
- Special cases (e.g., @types/jsdom in devDependencies only)
- Version prefix consistency (all use `^`)
- No overlap between dependencies and devDependencies

**Coverage**: 18 tests covering all synchronized dependencies

### Running Tests

```bash
# Run dependency sync tests only
npm test tests/shared/dependency-sync.test.ts

# Run all tests
npm run test:run
```

## Scripts

### `/scripts/sync-dependencies.js`

**Purpose**: Synchronize all package.json files to canonical versions

**Key Features**:
- Reads all package.json files
- Applies canonical versions defined in script
- Special handling for misplaced dependencies (e.g., @types/jsdom)
- Reports all changes made
- Provides next steps guidance

**Canonical Versions**: Defined in the script's `canonicalVersions` object

### `/scripts/validate-dependencies.js`

**Purpose**: Validate dependency synchronization (used in CI)

**Key Features**:
- Checks all shared dependencies match
- Validates version prefix consistency
- Checks for dependency/devDependency overlap
- Reports specific mismatches
- Exits with error code 1 if validation fails

## Adding New Dependencies

When adding a new dependency that should be shared:

1. Add it to `canonicalVersions` in `scripts/sync-dependencies.js`
2. Add validation in `scripts/validate-dependencies.js`
3. Add test case in `tests/shared/dependency-sync.test.ts`
4. Run `npm run deps:sync`
5. Run `npm install`
6. Verify tests pass

## Upgrading Dependencies

To upgrade a dependency across all packages:

1. Update version in `scripts/sync-dependencies.js` (canonicalVersions)
2. Run `npm run deps:sync`
3. Run `npm install`
4. Run `npm run build` to check for breaking changes
5. Run `npm run test:all` to verify tests pass
6. Update tests if version expectations changed
7. Commit changes including:
   - All package.json files
   - package-lock.json
   - sync-dependencies.js
   - dependency-sync.test.ts (if version changed)

## Troubleshooting

### "Dependency version mismatch" error in CI

**Cause**: package.json files are out of sync

**Solution**:
```bash
npm run deps:sync
npm install
git add -A
git commit -m "chore: synchronize dependencies"
```

### "Cannot find module" after sync

**Cause**: package-lock.json not updated

**Solution**:
```bash
npm install
```

### Build fails after dependency sync

**Cause**: New version has breaking changes

**Solution**:
1. Check changelog for the dependency
2. Either fix breaking changes in code
3. Or downgrade to compatible version in sync script
4. Re-run sync and tests

## Maintenance

### Regular Dependency Updates

Recommended schedule:
- **Monthly**: Check for minor/patch updates
- **Quarterly**: Review major version updates
- **As needed**: Security updates

Process:
1. Update versions in `sync-dependencies.js`
2. Run sync script
3. Run full test suite
4. Check for deprecation warnings
5. Update documentation if needed

### Monitoring

Watch for:
- Dependabot/Renovate alerts
- Security advisories
- Deprecated package warnings
- Breaking change announcements

## References

- [npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)
- [Semantic Versioning](https://semver.org/)
- [Package.json documentation](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)
