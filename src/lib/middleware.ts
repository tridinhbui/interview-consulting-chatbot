import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, extractTokenFromHeader } from './auth'
import { AuthUser } from '@/types'
import { rateLimit, getClientIP, addSecurityHeaders } from './security'
import { rateLimits } from './validation'
import logger from './logger'

export interface AuthenticatedRequest extends NextRequest {
  user?: AuthUser
}

export function withAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return async (req: AuthenticatedRequest) => {
    const startTime = Date.now()
    const clientIP = getClientIP(req)
    
    try {
      // Rate limiting for API endpoints
      const rateLimitResult = rateLimit(clientIP, rateLimits.api.windowMs, rateLimits.api.maxRequests)
      if (!rateLimitResult.success) {
        logger.security('Rate limit exceeded', 'medium', { ip: clientIP, path: req.url })
        return NextResponse.json(
          { error: 'Too many requests' },
          { status: 429 }
        )
      }

      const authHeader = req.headers.get('authorization')
      const token = extractTokenFromHeader(authHeader)
      
      if (!token) {
        logger.security('Missing authentication token', 'low', { ip: clientIP, path: req.url })
        return NextResponse.json(
          { error: 'Authentication token required' },
          { status: 401 }
        )
      }

      const user = verifyToken(token)
      if (!user) {
        logger.security('Invalid or expired token', 'medium', { ip: clientIP, path: req.url })
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        )
      }

      req.user = user
      logger.auth('API access', user.id, true, { ip: clientIP, path: req.url })
      
      const response = await handler(req)
      
      // Add security headers
      addSecurityHeaders(response.headers)
      
      // Log successful request
      logger.api(req.method, req.url, response.status, Date.now() - startTime, { userId: user.id })
      
      return response
    } catch (error) {
      logger.errorWithStack(error as Error, 'Auth middleware error', { ip: clientIP, path: req.url })
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }
  }
}

export function withAdminAuth(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(async (req: AuthenticatedRequest) => {
    if (req.user?.role !== 'admin') {
      logger.security('Unauthorized admin access attempt', 'high', { 
        userId: req.user?.id, 
        ip: getClientIP(req), 
        path: req.url 
      })
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }
    
    logger.userActivity(req.user.id, 'admin_access', req.url, { ip: getClientIP(req) })
    return await handler(req)
  })
}

export function handleError(error: any, context?: string) {
  logger.errorWithStack(error, context || 'API Error')
  
  if (error.name === 'ValidationError') {
    return NextResponse.json(
      { error: 'Validation failed', details: error.message },
      { status: 400 }
    )
  }
  
  if (error.code === 11000) {
    return NextResponse.json(
      { error: 'Duplicate entry', details: 'Resource already exists' },
      { status: 409 }
    )
  }
  
  if (error.name === 'CastError') {
    return NextResponse.json(
      { error: 'Invalid ID format' },
      { status: 400 }
    )
  }
  
  // Don't expose internal errors in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message || 'Internal server error'
  
  return NextResponse.json(
    { error: message },
    { status: 500 }
  )
}

// Rate limiting middleware for specific endpoints
export function withRateLimit(
  config: { windowMs: number; maxRequests: number },
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const clientIP = getClientIP(req)
    const rateLimitResult = rateLimit(clientIP, config.windowMs, config.maxRequests)
    
    if (!rateLimitResult.success) {
      logger.security('Rate limit exceeded', 'medium', { 
        ip: clientIP, 
        path: req.url,
        limit: config.maxRequests,
        window: config.windowMs
      })
      
      const response = NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
      
      response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
      response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
      response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
      
      return response
    }
    
    const response = await handler(req)
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimitResult.resetTime).toISOString())
    
    return response
  }
}
