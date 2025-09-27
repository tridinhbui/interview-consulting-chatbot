import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import CaseTemplate from '@/lib/models/CaseTemplate'
import { withAuth, withAdminAuth, AuthenticatedRequest, handleError } from '@/lib/middleware'

const createCaseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  industry: z.string().min(1, 'Industry is required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedDuration: z.number().min(5).max(180),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  initialMessage: z.string().min(1, 'Initial message is required'),
  tags: z.array(z.string()).optional().default([]),
  isActive: z.boolean().optional().default(true)
})

// GET /api/cases - Get all active case templates
async function getHandler(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    
    const { searchParams } = new URL(req.url)
    const industry = searchParams.get('industry')
    const difficulty = searchParams.get('difficulty')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const filter: any = { isActive: true }
    if (industry) filter.industry = industry
    if (difficulty) filter.difficulty = difficulty
    
    const cases = await CaseTemplate.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    
    const total = await CaseTemplate.countDocuments(filter)
    
    return NextResponse.json({
      cases,
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

// POST /api/cases - Create new case template (admin only)
async function postHandler(req: AuthenticatedRequest) {
  try {
    await dbConnect()
    
    const body = await req.json()
    const data = createCaseSchema.parse(body)
    
    const caseTemplate = await CaseTemplate.create({
      ...data,
      createdBy: req.user!.id
    })
    
    await caseTemplate.populate('createdBy', 'name email')
    
    return NextResponse.json({
      message: 'Case template created successfully',
      case: caseTemplate
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
export const POST = withAdminAuth(postHandler)
