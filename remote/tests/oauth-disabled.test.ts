import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Application } from 'express';
import { createExpressServer } from '../server.js';

/**
 * Test suite for OAuth disabled functionality
 *
 * Verifies that when ENABLE_OAUTH is false (default), the server:
 * 1. Returns clear error for OAuth endpoints
 * 2. Works normally for MCP endpoint without auth
 * 3. Properly reads the environment variable
 */
describe('OAuth Disabled', () => {
  let app: Application;

  beforeEach(async () => {
    // Ensure ENABLE_OAUTH is false
    process.env.ENABLE_OAUTH = 'false';
    app = await createExpressServer();
  });

  afterEach(() => {
    delete process.env.ENABLE_OAUTH;
  });

  it('should return clear error when trying to access /register endpoint', async () => {
    const response = await request(app).post('/register').send({ client_id: 'test' }).expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('OAuth is not enabled');
  });

  it('should return clear error when trying to access /authorize endpoint', async () => {
    const response = await request(app).get('/authorize').expect(404);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('OAuth is not enabled');
  });

  it('should allow MCP endpoint to work without authentication', async () => {
    // Initialize request should work without OAuth
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0',
        },
      },
    };

    const response = await request(app).post('/mcp').send(initRequest).expect(200);

    expect(response.body).toHaveProperty('result');
  });
});

describe('OAuth Enabled (future)', () => {
  let app: Application;

  beforeEach(async () => {
    process.env.ENABLE_OAUTH = 'true';
    app = await createExpressServer();
  });

  afterEach(() => {
    delete process.env.ENABLE_OAUTH;
  });

  it('should indicate OAuth is not yet implemented when enabled', async () => {
    const response = await request(app).post('/register').send({ client_id: 'test' }).expect(501);

    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toContain('not yet implemented');
  });
});
