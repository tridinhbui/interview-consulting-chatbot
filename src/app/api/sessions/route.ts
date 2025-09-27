import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import Session from '@/lib/models/Session'
import CaseTemplate from '@/lib/models/CaseTemplate'
import Message from '@/lib/models/Message'
import { withAuth, AuthenticatedRequest, handleError } from '@/lib/middleware'

const createSessionSchema = z.object({
  caseTemplateId: z.string().min(1, 'Case template ID is required')
})

// GET /api/sessions - Get user's sessions
async function getHandler(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const filter: any = { userId: req.user!.id }
    if (status) filter.status = status
    
    const sessions = await Session.find(filter)
      .populate('caseTemplateId', 'title description industry difficulty estimatedDuration')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    
    const total = await Session.countDocuments(filter)
    
    return NextResponse.json({
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
    
  } catch (error) {
    return handleError(error)
  }
}

// POST /api/sessions - Create new session
async function postHandler(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    
    const body = await req.json()
    const { caseTemplateId } = createSessionSchema.parse(body)
    
    // Verify case template exists and is active
    const caseTemplate = await CaseTemplate.findById(caseTemplateId)
    if (!caseTemplate || !caseTemplate.isActive) {
      return NextResponse.json(
        { error: 'Case template not found or inactive' },
        { status: 404 }
      )
    }
    
    // Create session
    const session = await Session.create({
      userId: req.user!.id,
      caseTemplateId,
      status: 'active'
    })
    
    // Create initial system message
    await Message.create({
      sessionId: session._id,
      role: 'system',
      content: caseTemplate.systemPrompt,
      timestamp: new Date()
    })
    
    // Create initial assistant message
    await Message.create({
      sessionId: session._id,
      role: 'assistant',
      content: caseTemplate.initialMessage,
      timestamp: new Date()
    })
    
    await session.populate('caseTemplateId', 'title description industry difficulty estimatedDuration')
    
    return NextResponse.json({
      message: 'Session created successfully',
      session
    }, { status: 201 })
    
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

export const GET = withAuth(getHandler)
export const POST = withAuth(postHandler)
