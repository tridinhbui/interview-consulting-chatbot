import crypto from 'crypto'
import { NextRequest } from 'next/server'

// Security headers configuration
export const securityHeaders = {
  'X-DNS-Prefetch-Control': 'off',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'"
  ].join('; ')
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(
  identifier: string,
  windowMs: number,
  maxRequests: number
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const key = identifier
  const window = rateLimitStore.get(key)

  if (!window || now > window.resetTime) {
    // New window or expired window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs
    }
  }

  if (window.count >= maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetTime: window.resetTime
    }
  }

  // Increment counter
  window.count++
  rateLimitStore.set(key, window)

  return {
    success: true,
    remaining: maxRequests - window.count,
    resetTime: window.resetTime
  }
}

// Get client IP address
export function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return req.ip || 'unknown'
}

// Generate secure random tokens
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Hash sensitive data
export function hashData(data: string, salt?: string): string {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512')
  return `${actualSalt}:${hash.toString('hex')}`
}

// Verify hashed data
export function verifyHashedData(data: string, hashedData: string): boolean {
  const [salt, hash] = hashedData.split(':')
  const verifyHash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512')
  return hash === verifyHash.toString('hex')
}

// Encrypt sensitive data
export function encrypt(text: string, key: string): string {
  const algorithm = 'aes-256-gcm'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipher(algorithm, key)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

// Decrypt sensitive data
export function decrypt(encryptedData: string, key: string): string {
  const algorithm = 'aes-256-gcm'
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':')
  
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const decipher = crypto.createDecipher(algorithm, key)
  
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isValid: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  // Length check
  if (password.length >= 8) score += 1
  else feedback.push('Password should be at least 8 characters long')

  if (password.length >= 12) score += 1

  // Character variety checks
  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')

  if (/\d/.test(password)) score += 1
  else feedback.push('Include numbers')

  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  else feedback.push('Include special characters')

  // Common patterns check
  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push('Avoid repeating characters')

  const isValid = score >= 4
  
  return { isValid, score, feedback }
}

// Session security
export function generateSessionId(): string {
  return generateSecureToken(32)
}

export function isValidSessionId(sessionId: string): boolean {
  return /^[a-f0-9]{64}$/.test(sessionId)
}

// CSRF protection
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

export function verifyCSRFToken(token: string, expectedToken: string): boolean {
  if (!token || !expectedToken) return false
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(expectedToken, 'hex')
  )
}

// Input sanitization for different contexts
export function sanitizeForHTML(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeForSQL(input: string): string {
  return input.replace(/['";\\]/g, '')
}

export function sanitizeForRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Audit logging helpers
export interface AuditLogEntry {
  userId?: string
  action: string
  resource: string
  resourceId?: string
  ip: string
  userAgent: string
  timestamp: Date
  success: boolean
  details?: Record<string, any>
}

export function createAuditLog(
  req: NextRequest,
  action: string,
  resource: string,
  options: {
    userId?: string
    resourceId?: string
    success?: boolean
    details?: Record<string, any>
  } = {}
): AuditLogEntry {
  return {
    userId: options.userId,
    action,
    resource,
    resourceId: options.resourceId,
    ip: getClientIP(req),
    userAgent: req.headers.get('user-agent') || 'unknown',
    timestamp: new Date(),
    success: options.success ?? true,
    details: options.details
  }
}

// Security middleware helpers
export function addSecurityHeaders(headers: Headers): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value)
  })
}

export function validateOrigin(req: NextRequest, allowedOrigins: string[]): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // Same-origin requests don't have origin header
  
  return allowedOrigins.includes(origin)
}

// Honeypot field validation (bot detection)
export function validateHoneypot(honeypotValue: string): boolean {
  // Honeypot field should be empty (filled by bots)
  return !honeypotValue || honeypotValue.trim() === ''
}
