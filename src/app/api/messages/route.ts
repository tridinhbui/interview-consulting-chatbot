import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/mongodb'
import Message from '@/lib/models/Message'
import Session from '@/lib/models/Session'
import CaseTemplate from '@/lib/models/CaseTemplate'
import { withAuth, AuthenticatedRequest, handleError, withRateLimit } from '@/lib/middleware'
import { createMessageSchema, rateLimits } from '@/lib/validation'
import { sanitizeInput } from '@/lib/security'
import logger from '@/lib/logger'
import AIService from '@/lib/ai-service'

// POST /api/messages - Send message and get AI response
async function postHandler(req: AuthenticatedRequest) {
  const startTime = Date.now()
  
  try {
    await dbConnect()
    
    const body = await req.json()
    const { sessionId, content, role } = createMessageSchema.parse(body)
    
    // Sanitize message content
    const sanitizedContent = sanitizeInput(content)
    
    // Verify session belongs to user and is active
    const session = await Session.findOne({
      _id: sessionId,
      userId: req.user!.id,
      status: 'active'
    }).populate('caseTemplateId')
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or inactive' },
        { status: 404 }
      )
    }
    
    // Create user message
    const userMessage = await Message.create({
      sessionId,
      role: 'user',
      content: sanitizedContent,
      timestamp: new Date()
    })
    
    // Log user message
    logger.userActivity(req.user!.id, 'send_message', sessionId, { 
      messageLength: sanitizedContent.length,
      sessionId 
    })
    
    // Get conversation history for AI context
    const messages = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .select('role content timestamp')
    
    // Generate AI response using enhanced AI service
    const caseTemplate = session.caseTemplateId as any
    const aiStartTime = Date.now()
    const aiResponse = await AIService.generateResponse(
      caseTemplate,
      messages,
      sanitizedContent
    )
    const aiDuration = Date.now() - aiStartTime
    
    // Log AI interaction
    logger.ai('generate_response', sessionId, aiDuration, {
      userId: req.user!.id,
      caseTemplateId: caseTemplate._id,
      messageCount: messages.length
    })
    
    // Create AI message with metadata
    const assistantMessage = await Message.create({
      sessionId,
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      metadata: {
        thinking: aiResponse.thinking,
        suggestions: aiResponse.suggestions
      }
    })
    
    // Update session score if provided
    if (aiResponse.score !== undefined) {
      await Session.findByIdAndUpdate(sessionId, { 
        score: aiResponse.score,
        feedback: await AIService.generateSessionFeedback(session, [...messages, userMessage], caseTemplate)
      })
    }
    
    // Log successful message exchange
    logger.performance('message_exchange', Date.now() - startTime, {
      userId: req.user!.id,
      sessionId,
      aiDuration
    })
    
    return NextResponse.json({
      userMessage,
      assistantMessage
    }, { status: 201 })
    
  } catch (error) {
    logger.errorWithStack(error as Error, 'Message creation failed', {
      userId: req.user!.id,
      sessionId: body?.sessionId,
      duration: Date.now() - startTime
    })
    
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.message },
        { status: 400 }
      )
    }
    return handleError(error, 'Message processing')
  }
}

export const POST = withRateLimit(rateLimits.messages, withAuth(postHandler))
