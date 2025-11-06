#!/usr/bin/env node

import { config } from 'dotenv';
import { createExpressServer } from './server.js';
import { runHealthChecks, type HealthCheckResult } from './shared/healthcheck.js';

// Load environment variables
config();

/**
 * Validates environment variables and logs configuration
 */
function validateEnvironment(): void {
  // Validate OPTIMIZE_FOR if provided
  const optimizeFor = process.env.OPTIMIZE_FOR;
  if (optimizeFor && !['cost', 'speed'].includes(optimizeFor)) {
    console.error(`Invalid OPTIMIZE_FOR value: ${optimizeFor}. Must be 'cost' or 'speed'.`);
    process.exit(1);
  }

  // Log available services
  const available: string[] = [];
  if (process.env.FIRECRAWL_API_KEY) available.push('Firecrawl');
  if (process.env.ANTHROPIC_API_KEY) available.push('Anthropic');
  if (process.env.OPENAI_API_KEY) available.push('OpenAI');

  console.error(
    `Pulse Fetch HTTP Server starting with services: native${
      available.length > 0 ? ', ' + available.join(', ') : ''
    }`
  );

  if (optimizeFor) {
    console.error(`Optimization strategy: ${optimizeFor}`);
  }

  const resumability = process.env.ENABLE_RESUMABILITY === 'true';
  console.error(`Resumability: ${resumability ? 'enabled' : 'disabled'}`);
}

/**
 * Main entry point for the HTTP streaming MCP server
 */
async function main(): Promise<void> {
  validateEnvironment();

  // Run health checks if not skipped
  if (process.env.SKIP_HEALTH_CHECKS !== 'true') {
    console.error('Running authentication health checks...');
    const healthResults = await runHealthChecks();

    const failedChecks = healthResults.filter((result: HealthCheckResult) => !result.success);
    if (failedChecks.length > 0) {
      console.error('\nAuthentication health check failures:');
      failedChecks.forEach(({ service, error }: { service: string; error?: string }) => {
        console.error(`  ${service}: ${error}`);
      });
      console.error('\nTo skip health checks, set SKIP_HEALTH_CHECKS=true');
      process.exit(1);
    }

    const successfulChecks = healthResults.filter((result: HealthCheckResult) => result.success);
    if (successfulChecks.length > 0) {
      console.error(
        'Health checks passed for:',
        successfulChecks.map((r: HealthCheckResult) => r.service).join(', ')
      );
    }
  }

  // Create Express server
  const app = await createExpressServer();
  const port = parseInt(process.env.PORT || '3060', 10);

  // Start listening
  const server = app.listen(port, () => {
    console.error(`\n${'='.repeat(60)}`);
    console.error('Pulse Fetch HTTP Server is running');
    console.error(`${'='.repeat(60)}`);
    console.error(`Server:       http://localhost:${port}`);
    console.error(`MCP endpoint: http://localhost:${port}/mcp`);
    console.error(`Health check: http://localhost:${port}/health`);
    console.error(`${'='.repeat(60)}\n`);
  });

  // Handle server startup errors
  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Error: Port ${port} is already in use`);
      console.error('Please set a different PORT in your environment variables');
    } else {
      console.error('Server error:', error);
    }
    process.exit(1);
  });
}

// Run main and handle errors
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
