import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import dbConnect from '@/lib/mongodb'
import CaseTemplate from '@/lib/models/CaseTemplate'
import { withAuth, withAdminAuth, AuthenticatedRequest, handleError } from '@/lib/middleware'

const updateCaseSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  industry: z.string().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  estimatedDuration: z.number().min(5).max(180).optional(),
  systemPrompt: z.string().min(1).optional(),
  initialMessage: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})

// GET /api/cases/[id] - Get single case template
async function getHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const caseTemplate = await CaseTemplate.findById(params.id)
      .populate('createdBy', 'name email')
    
    if (!caseTemplate) {
      return NextResponse.json(
        { error: 'Case template not found' },
        { status: 404 }
      )
    }
    
    // Non-admin users can only see active cases
    if (req.user!.role !== 'admin' && !caseTemplate.isActive) {
      return NextResponse.json(
        { error: 'Case template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ case: caseTemplate })
    
  } catch (error) {
    return handleError(error)
  }
}

// PUT /api/cases/[id] - Update case template (admin only)
async function putHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const body = await req.json()
    const data = updateCaseSchema.parse(body)
    
    const caseTemplate = await CaseTemplate.findByIdAndUpdate(
      params.id,
      data,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
    
    if (!caseTemplate) {
      return NextResponse.json(
        { error: 'Case template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Case template updated successfully',
      case: caseTemplate
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

// DELETE /api/cases/[id] - Delete case template (admin only)
async function deleteHandler(req: AuthenticatedRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect()
    
    const caseTemplate = await CaseTemplate.findByIdAndDelete(params.id)
    
    if (!caseTemplate) {
      return NextResponse.json(
        { error: 'Case template not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: 'Case template deleted successfully'
    })
    
  } catch (error) {
    return handleError(error)
  }
}

export const GET = withAuth(getHandler)
export const PUT = withAdminAuth(putHandler)
export const DELETE = withAdminAuth(deleteHandler)
