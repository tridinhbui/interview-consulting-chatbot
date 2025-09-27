import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { hashPassword, generateToken } from '@/lib/auth'
import { handleError, withRateLimit } from '@/lib/middleware'
import { registerSchema, rateLimits } from '@/lib/validation'
import { getClientIP, validateHoneypot } from '@/lib/security'
import logger from '@/lib/logger'

async function registerHandler(req: NextRequest) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  
  try {
    await dbConnect()
    
    const body = await req.json()
    
    // Honeypot validation (bot detection)
    if (!validateHoneypot(body.honeypot)) {
      logger.security('Bot registration attempt detected', 'high', { ip: clientIP })
      return NextResponse.json(
        { error: 'Registration failed' },
        { status: 400 }
      )
    }
    
    const { email, password, name } = registerSchema.parse(body)
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      logger.security('Registration attempt with existing email', 'low', { 
        email: email.toLowerCase(), 
        ip: clientIP 
      })
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    
    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim(),
      role: 'user'
    })
    
    // Generate token
    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role
    })
    
    // Log successful registration
    logger.auth('register', user._id.toString(), true, { 
      ip: clientIP,
      email: user.email,
      duration: Date.now() - startTime
    })
    
    logger.userActivity(user._id.toString(), 'account_created', 'user', { ip: clientIP })
    
    return NextResponse.json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })
    
  } catch (error) {
    logger.auth('register', 'unknown', false, { 
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
    return handleError(error, 'User registration')
  }
}

export const POST = withRateLimit(rateLimits.auth, registerHandler)
