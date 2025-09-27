import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Session from '@/lib/models/Session'
import Message from '@/lib/models/Message'
import { withAuth, AuthenticatedRequest, handleError } from '@/lib/middleware'

const updateSessionSchema = z.object({
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  feedback: z.string().optional(),
  score: z.number().min(0).max(100).optional()
})

// GET /api/sessions/[id] - Get session with messages
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const session = await Session.findOne({
      _id: params.id,
      userId: req.user!.id
    }).populate('caseTemplateId', 'title description industry difficulty estimatedDuration')
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    const messages = await Message.find({ sessionId: params.id })
      .sort({ timestamp: 1 })
    
    return NextResponse.json({
      session,
      messages
    })
    
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/sessions/[id] - Update session
async function putHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const body = await req.json()
    const data = updateSessionSchema.parse(body)
    
    // If completing session, set completedAt
    if (data.status === 'completed') {
      data.completedAt = new Date()
    }
    
    const session = await Session.findOneAndUpdate(
      { _id: params.id, userId: req.user!.id },
      data,
      { new: true, runValidators: true }
    ).populate('caseTemplateId', 'title description industry difficulty estimatedDuration')
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Session updated successfully',
      session
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return handleError(error)
  }
}

// DELETE /api/sessions/[id] - Delete session
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const session = await Session.findOneAndDelete({
      _id: params.id,
      userId: req.user!.id
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }
    
    // Delete all messages in this session
    await Message.deleteMany({ sessionId: params.id })
    
    return NextResponse.json({
      message: 'Session deleted successfully'
    })
    
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withAuth(getHandler)
export const PUT = withAuth(putHandler)
export const DELETE = withAuth(deleteHandler)
