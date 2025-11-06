#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMCPServer } from './shared/index.js';
import { runHealthChecks, type HealthCheckResult } from './shared/config/health-checks.js';
import { logInfo, logError } from './shared/utils/logging.js';

// Validate environment variables
function validateEnvironment() {
  const required: Array<{ name: string; description: string }> = [];

  // Check required variables
  const missing = required.filter(({ name }) => !process.env[name]);

  if (missing.length > 0) {
    logError('validateEnvironment', new Error('Missing required environment variables'), {
      missing: missing.map(({ name, description }) => `${name}: ${description}`),
    });
    process.exit(1);
  }

  // Validate OPTIMIZE_FOR if provided
  const optimizeFor = process.env.OPTIMIZE_FOR;
  if (optimizeFor && !['cost', 'speed'].includes(optimizeFor)) {
    logError('validateEnvironment', new Error(`Invalid OPTIMIZE_FOR value: ${optimizeFor}`), {
      validValues: ['cost', 'speed'],
    });
    process.exit(1);
  }

  // Log available services
  const available = [];
  if (process.env.FIRECRAWL_API_KEY) available.push('Firecrawl');

  logInfo(
    'startup',
    `Pulse Fetch starting with services: native${available.length > 0 ? ', ' + available.join(', ') : ''}`,
    {
      services: ['native', ...available],
    }
  );

  if (optimizeFor) {
    logInfo('startup', `Optimization strategy: ${optimizeFor}`, { optimizeFor });
  }
}

async function main() {
  validateEnvironment();

  // Run health checks if SKIP_HEALTH_CHECKS is not set
  if (process.env.SKIP_HEALTH_CHECKS !== 'true') {
    logInfo('healthCheck', 'Running authentication health checks...');
    const healthResults = await runHealthChecks();

    const failedChecks = healthResults.filter((result: HealthCheckResult) => !result.success);
    if (failedChecks.length > 0) {
      logError('healthCheck', new Error('Authentication health check failures'), {
        failures: failedChecks.map((check) => ({
          service: check.service,
          error: check.error || 'Unknown error',
        })),
      });
      logInfo('healthCheck', 'To skip health checks, set SKIP_HEALTH_CHECKS=true');
      process.exit(1);
    }

    const successfulChecks = healthResults.filter((result: HealthCheckResult) => result.success);
    if (successfulChecks.length > 0) {
      logInfo('healthCheck', 'Health checks passed', {
        services: successfulChecks.map((r: HealthCheckResult) => r.service),
      });
    }
  }

  const { server, registerHandlers } = createMCPServer();
  await registerHandlers(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  logError('main', error);
  process.exit(1);
});
