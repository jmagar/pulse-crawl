import { Request, Response, NextFunction } from 'express';

/**
 * Placeholder for future authentication middleware
 * Currently a no-op passthrough
 *
 * Future implementation could use:
 * - Bearer token validation
 * - OAuth 2.0 with MCP SDK auth helpers
 * - API key checking
 * - JWT verification
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implement authentication logic
  // Example: Check Authorization header, validate token, etc.
  next();
}
