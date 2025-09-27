import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  meta?: Record<string, any>
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
}

class Logger {
  private logLevel: LogLevel
  private logDir: string
  private streams: Map<string, NodeJS.WritableStream>

  constructor() {
    this.logLevel = this.getLogLevel()
    this.logDir = join(process.cwd(), 'logs')
    this.streams = new Map()
    this.ensureLogDirectory()
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase() || 'INFO'
    return LogLevel[level as keyof typeof LogLevel] ?? LogLevel.INFO
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true })
    }
  }

  private getStream(filename: string): NodeJS.WritableStream {
    if (!this.streams.has(filename)) {
      const stream = createWriteStream(join(this.logDir, filename), { flags: 'a' })
      this.streams.set(filename, stream)
    }
    return this.streams.get(filename)!
  }

  private formatLogEntry(entry: LogEntry): string {
    const { timestamp, level, message, meta, userId, sessionId, ip, userAgent } = entry
    
    const logData = {
      timestamp,
      level,
      message,
      ...(userId && { userId }),
      ...(sessionId && { sessionId }),
      ...(ip && { ip }),
      ...(userAgent && { userAgent }),
      ...(meta && { meta })
    }

    return JSON.stringify(logData) + '\n'
  }

  private writeLog(level: LogLevel, levelName: string, message: string, meta?: Record<string, any>): void {
    if (level > this.logLevel) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message,
      meta
    }

    const logLine = this.formatLogEntry(entry)

    // Write to console in development
    if (process.env.NODE_ENV === 'development') {
      const colors = {
        ERROR: '\x1b[31m', // Red
        WARN: '\x1b[33m',  // Yellow
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[37m'  // White
      }
      const reset = '\x1b[0m'
      console.log(`${colors[levelName as keyof typeof colors]}[${levelName}]${reset} ${message}`, meta || '')
    }

    // Write to file
    const filename = `app-${new Date().toISOString().split('T')[0]}.log`
    const stream = this.getStream(filename)
    stream.write(logLine)

    // Write errors to separate file
    if (level === LogLevel.ERROR) {
      const errorFilename = `error-${new Date().toISOString().split('T')[0]}.log`
      const errorStream = this.getStream(errorFilename)
      errorStream.write(logLine)
    }
  }

  error(message: string, meta?: Record<string, any>): void {
    this.writeLog(LogLevel.ERROR, 'ERROR', message, meta)
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.writeLog(LogLevel.WARN, 'WARN', message, meta)
  }

  info(message: string, meta?: Record<string, any>): void {
    this.writeLog(LogLevel.INFO, 'INFO', message, meta)
  }

  debug(message: string, meta?: Record<string, any>): void {
    this.writeLog(LogLevel.DEBUG, 'DEBUG', message, meta)
  }

  // Structured logging methods
  auth(action: string, userId: string, success: boolean, meta?: Record<string, any>): void {
    this.info(`Auth: ${action}`, {
      userId,
      success,
      category: 'authentication',
      ...meta
    })
  }

  api(method: string, path: string, statusCode: number, duration: number, meta?: Record<string, any>): void {
    const level = statusCode >= 400 ? 'error' : 'info'
    this[level as 'error' | 'info'](`API: ${method} ${path} - ${statusCode}`, {
      method,
      path,
      statusCode,
      duration,
      category: 'api',
      ...meta
    })
  }

  security(event: string, severity: 'low' | 'medium' | 'high', meta?: Record<string, any>): void {
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info'
    this[level](`Security: ${event}`, {
      severity,
      category: 'security',
      ...meta
    })
  }

  database(operation: string, collection: string, duration: number, meta?: Record<string, any>): void {
    this.debug(`DB: ${operation} on ${collection}`, {
      operation,
      collection,
      duration,
      category: 'database',
      ...meta
    })
  }

  ai(action: string, sessionId: string, duration: number, meta?: Record<string, any>): void {
    this.info(`AI: ${action}`, {
      sessionId,
      duration,
      category: 'ai',
      ...meta
    })
  }

  // Performance monitoring
  performance(operation: string, duration: number, meta?: Record<string, any>): void {
    const level = duration > 5000 ? 'warn' : 'debug' // Warn if operation takes > 5s
    this[level](`Performance: ${operation} took ${duration}ms`, {
      operation,
      duration,
      category: 'performance',
      ...meta
    })
  }

  // User activity logging
  userActivity(userId: string, action: string, resource: string, meta?: Record<string, any>): void {
    this.info(`User Activity: ${action} on ${resource}`, {
      userId,
      action,
      resource,
      category: 'user_activity',
      ...meta
    })
  }

  // Error with stack trace
  errorWithStack(error: Error, context?: string, meta?: Record<string, any>): void {
    this.error(`${context ? `${context}: ` : ''}${error.message}`, {
      stack: error.stack,
      name: error.name,
      ...meta
    })
  }

  // Cleanup method
  close(): void {
    this.streams.forEach(stream => {
      if (stream && typeof stream.end === 'function') {
        stream.end()
      }
    })
    this.streams.clear()
  }
}

// Create singleton instance
const logger = new Logger()

// Graceful shutdown
process.on('SIGINT', () => {
  logger.close()
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.close()
  process.exit(0)
})

export default logger

// Utility functions for request logging
export function logRequest(req: any, startTime: number, statusCode: number, meta?: Record<string, any>): void {
  const duration = Date.now() - startTime
  logger.api(req.method, req.url, statusCode, duration, {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    ...meta
  })
}

export function logError(error: Error, context?: string, meta?: Record<string, any>): void {
  logger.errorWithStack(error, context, meta)
}

export function logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', req?: any, meta?: Record<string, any>): void {
  logger.security(event, severity, {
    ip: req?.ip,
    userAgent: req?.headers['user-agent'],
    ...meta
  })
}
