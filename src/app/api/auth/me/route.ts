import { NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import User from '@/lib/models/User'
import { withAuth, AuthenticatedRequest, handleError } from '@/lib/middleware'

async function handler(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    
    const user = await User.findById(req.user!.id).select('-password')
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    })
    
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withAuth(handler)
