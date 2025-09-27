import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { verifyPassword, generateToken } from '@/lib/auth'
import { handleError, withRateLimit } from '@/lib/middleware'
import { loginSchema, rateLimits } from '@/lib/validation'
import { getClientIP } from '@/lib/security'
import logger from '@/lib/logger'

async function loginHandler(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  
  try {
    await dbConnect()
    
    const body = await req.json()
    const { email, password } = loginSchema.parse(body)
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      logger.security('Login attempt with non-existent email', 'low', { 
        email: email.toLowerCase(), 
        ip: clientIP 
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      logger.security('Login attempt with invalid password', 'medium', { 
        userId: user._id.toString(),
        email: user.email, 
        ip: clientIP 
      })
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }
    
    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    })
    
    // Log successful login
    logger.auth('login', user._id.toString(), true, { 
      ip: clientIP,
      email: user.email,
      duration: Date.now() - startTime
    })
    
    logger.userActivity(user._id.toString(), 'login', 'user', { ip: clientIP })
    
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
    
  } catch (error) {
    logger.auth('login', 'unknown', false, { 
      ip: clientIP, 
      error: (error as Error).message,
      duration: Date.now() - startTime
    })
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    return handleError(error, 'User login')
  }
}

export const POST = withRateLimit(rateLimits.auth, loginHandler)
