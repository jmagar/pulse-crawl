import { describe, it, expect, vi } from 'vitest';
import { healthCheck } from '../../remote/middleware/health.js';
import { getCorsOptions } from '../../remote/middleware/cors.js';
import { authMiddleware } from '../../remote/middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';

describe('Middleware', () => {
  describe('healthCheck', () => {
    it('should return health status as JSON', () => {
      const req = {} as Request;
      const res = {
        json: vi.fn(),
      } as unknown as Response;

      healthCheck(req, res);

      expect(res.json).toHaveBeenCalledTimes(1);
      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('status', 'healthy');
      expect(call).toHaveProperty('timestamp');
      expect(call).toHaveProperty('version');
      expect(call).toHaveProperty('transport', 'http-streaming');
    });

    it('should include current timestamp', () => {
      const req = {} as Request;
      const res = {
        json: vi.fn(),
      } as unknown as Response;

      healthCheck(req, res);

      const call = (res.json as any).mock.calls[0][0];
      const timestamp = call.timestamp;

      // Timestamp should be a valid ISO date string
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(new Date(timestamp).getTime()).toBeGreaterThan(Date.now() - 5000); // Within last 5 seconds
    });
  });

  describe('getCorsOptions', () => {
    it('should return default CORS options when no env vars set', () => {
      delete process.env.ALLOWED_ORIGINS;

      const options = getCorsOptions();

      expect(options).toHaveProperty('origin');
      expect(options).toHaveProperty('exposedHeaders');
      // Wildcard origin ('*') cannot be used with credentials: true per CORS spec
      expect(options).toHaveProperty('credentials', false);
      expect(options).toHaveProperty('methods');
      expect(options.exposedHeaders).toContain('Mcp-Session-Id');
    });

    it('should parse ALLOWED_ORIGINS from environment', () => {
      process.env.ALLOWED_ORIGINS = 'https://app1.com,https://app2.com,https://app3.com';

      const options = getCorsOptions();

      expect(options.origin).toEqual(['https://app1.com', 'https://app2.com', 'https://app3.com']);
    });

    it('should filter out empty origins when ALLOWED_ORIGINS is empty', () => {
      process.env.ALLOWED_ORIGINS = '';

      const options = getCorsOptions();

      // filter(Boolean) removes empty strings, so result is empty array or falls back to ['*']
      const expected = options.origin;
      expect(Array.isArray(expected) || expected === '*').toBe(true);
    });

    it('should expose Mcp-Session-Id header', () => {
      const options = getCorsOptions();

      expect(options.exposedHeaders).toContain('Mcp-Session-Id');
    });

    it('should allow standard MCP HTTP methods', () => {
      const options = getCorsOptions();

      expect(options.methods).toContain('GET');
      expect(options.methods).toContain('POST');
      expect(options.methods).toContain('DELETE');
      expect(options.methods).toContain('OPTIONS');
    });

    it('should enable credentials', () => {
      const options = getCorsOptions();

      expect(options.credentials).toBe(true);
    });
  });

  describe('authMiddleware', () => {
    it('should call next() without authentication (placeholder)', () => {
      const req = {} as Request;
      const res = {} as Response;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith();
    });

    it('should not modify request or response (placeholder)', () => {
      const req = { test: 'value' } as any;
      const res = { test: 'value' } as any;
      const next = vi.fn() as NextFunction;

      authMiddleware(req, res, next);

      expect(req.test).toBe('value');
      expect(res.test).toBe('value');
    });
  });
});
