import { describe, it, expect } from 'vitest';
import { categorizeFirecrawlError } from './firecrawl-error-types.js';

describe('Firecrawl error categorization', () => {
  it('categorizes 401 as auth error', () => {
    const error = categorizeFirecrawlError(401, 'Invalid API key');
    expect(error.category).toBe('auth');
    expect(error.retryable).toBe(false);
    expect(error.userMessage).toContain('FIRECRAWL_API_KEY');
  });

  it('categorizes 402 as payment error', () => {
    const error = categorizeFirecrawlError(402, 'Credits exhausted');
    expect(error.category).toBe('payment');
    expect(error.retryable).toBe(false);
    expect(error.userMessage).toContain('billing');
  });

  it('categorizes 429 as rate limit with retry time', () => {
    const error = categorizeFirecrawlError(429, 'Rate limit exceeded');
    expect(error.category).toBe('rate_limit');
    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBe(60000);
  });

  it('categorizes 400 as validation error', () => {
    const error = categorizeFirecrawlError(400, 'Invalid URL');
    expect(error.category).toBe('validation');
    expect(error.retryable).toBe(false);
    expect(error.userMessage).toContain('Invalid URL');
  });

  it('categorizes 5xx as retryable server error', () => {
    const error = categorizeFirecrawlError(500, 'Internal server error');
    expect(error.category).toBe('server');
    expect(error.retryable).toBe(true);
    expect(error.retryAfterMs).toBe(5000);
  });

  it('parses JSON error messages', () => {
    const error = categorizeFirecrawlError(400, '{"error": "Invalid parameter"}');
    expect(error.message).toBe('Invalid parameter');
  });

  it('handles plain text error messages', () => {
    const error = categorizeFirecrawlError(500, 'Server unavailable');
    expect(error.message).toBe('Server unavailable');
  });

  it('categorizes 403 as auth error', () => {
    const error = categorizeFirecrawlError(403, 'Forbidden');
    expect(error.category).toBe('auth');
    expect(error.retryable).toBe(false);
  });

  it('categorizes 404 as validation error', () => {
    const error = categorizeFirecrawlError(404, 'Not found');
    expect(error.category).toBe('validation');
    expect(error.retryable).toBe(false);
  });

  it('handles network errors (ECONNREFUSED)', () => {
    const error = categorizeFirecrawlError(0, 'ECONNREFUSED');
    expect(error.category).toBe('network');
    expect(error.userMessage).toContain('Network error');
  });

  it('handles network errors (ETIMEDOUT)', () => {
    const error = categorizeFirecrawlError(0, 'ETIMEDOUT');
    expect(error.category).toBe('network');
    expect(error.userMessage).toContain('Network error');
  });

  it('handles all 5xx status codes', () => {
    [500, 502, 503, 504].forEach((code) => {
      const error = categorizeFirecrawlError(code, 'Server error');
      expect(error.category).toBe('server');
      expect(error.retryable).toBe(true);
      expect(error.retryAfterMs).toBe(5000);
    });
  });

  it('parses JSON with message field', () => {
    const error = categorizeFirecrawlError(400, '{"message": "Bad request"}');
    expect(error.message).toBe('Bad request');
  });

  it('handles malformed JSON gracefully', () => {
    const error = categorizeFirecrawlError(400, '{invalid json');
    expect(error.message).toBe('{invalid json');
  });
});
