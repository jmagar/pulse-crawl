/**
 * Logging utilities for consistent output across MCP servers
 */

/**
 * Log level enum for type safety
 */
export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

/**
 * Metadata type for structured logging context
 */
export type LogMetadata = Record<string, unknown>;

/**
 * Check if structured (JSON) logging is enabled
 */
function isStructuredLogging(): boolean {
  return process.env.LOG_FORMAT === 'json';
}

/**
 * Format a log entry for output
 */
function formatLog(
  level: LogLevel,
  context: string,
  message: string,
  metadata?: LogMetadata
): string {
  if (isStructuredLogging()) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      ...(metadata && Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
    return JSON.stringify(logEntry);
  }

  // Plain text format with optional metadata
  const metadataStr =
    metadata && Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
  return `[${level}] ${context}: ${message}${metadataStr}`;
}

/**
 * Log server startup message
 */
export function logServerStart(
  serverName: string,
  transport: string = 'stdio',
  metadata?: LogMetadata
): void {
  const message = `MCP server ${serverName} running on ${transport}`;
  if (isStructuredLogging()) {
    console.log(formatLog(LogLevel.INFO, 'startup', message, metadata));
  } else {
    console.log(message);
  }
}

/**
 * Log an informational message
 */
export function logInfo(context: string, message: string, metadata?: LogMetadata): void {
  console.log(formatLog(LogLevel.INFO, context, message, metadata));
}

/**
 * Log an error with context
 */
export function logError(context: string, error: unknown, metadata?: LogMetadata): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  console.error(formatLog(LogLevel.ERROR, context, message, metadata));
  if (stack && !isStructuredLogging()) {
    console.error(stack);
  } else if (stack && isStructuredLogging()) {
    // Include stack in JSON format
    console.error(
      JSON.stringify({
        ...JSON.parse(formatLog(LogLevel.ERROR, context, message, metadata)),
        stack,
      })
    );
  }
}

/**
 * Log a warning
 */
export function logWarning(context: string, message: string, metadata?: LogMetadata): void {
  console.warn(formatLog(LogLevel.WARN, context, message, metadata));
}

/**
 * Log debug information (only in development or when DEBUG is enabled)
 */
export function logDebug(context: string, message: string, metadata?: LogMetadata): void {
  if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
    console.debug(formatLog(LogLevel.DEBUG, context, message, metadata));
  }
}
