import { z } from 'zod'

// User validation schemas
export const registerSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required')
    .max(255, 'Email too long'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
})

export const loginSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z.string()
    .min(1, 'Password is required')
})

export const updateProfileSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(50, 'Name cannot exceed 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')
    .optional(),
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .optional()
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
})

// Case template validation schemas
export const createCaseTemplateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title cannot exceed 100 characters')
    .trim(),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description cannot exceed 1000 characters')
    .trim(),
  industry: z.string()
    .min(1, 'Industry is required')
    .max(50, 'Industry name too long')
    .trim(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced'], {
    errorMap: () => ({ message: 'Difficulty must be beginner, intermediate, or advanced' })
  }),
  estimatedDuration: z.number()
    .int('Duration must be a whole number')
    .min(5, 'Duration must be at least 5 minutes')
    .max(180, 'Duration cannot exceed 180 minutes'),
  systemPrompt: z.string()
    .min(10, 'System prompt must be at least 10 characters')
    .max(2000, 'System prompt cannot exceed 2000 characters')
    .trim(),
  initialMessage: z.string()
    .min(10, 'Initial message must be at least 10 characters')
    .max(1000, 'Initial message cannot exceed 1000 characters')
    .trim(),
  tags: z.array(z.string().trim().min(1).max(30))
    .max(10, 'Cannot have more than 10 tags')
    .optional()
    .default([]),
  isActive: z.boolean().optional().default(true)
})

export const updateCaseTemplateSchema = createCaseTemplateSchema.partial()

// Session validation schemas
export const createSessionSchema = z.object({
  caseTemplateId: z.string()
    .min(1, 'Case template ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid case template ID format')
})

export const updateSessionSchema = z.object({
  status: z.enum(['active', 'completed', 'abandoned']).optional(),
  feedback: z.string()
    .max(2000, 'Feedback cannot exceed 2000 characters')
    .trim()
    .optional(),
  score: z.number()
    .int('Score must be a whole number')
    .min(0, 'Score cannot be negative')
    .max(100, 'Score cannot exceed 100')
    .optional()
})

// Message validation schemas
export const createMessageSchema = z.object({
  sessionId: z.string()
    .min(1, 'Session ID is required')
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid session ID format'),
  content: z.string()
    .min(1, 'Message content is required')
    .max(2000, 'Message cannot exceed 2000 characters')
    .trim(),
  role: z.enum(['user', 'assistant']).default('user')
})

// Query parameter validation schemas
export const paginationSchema = z.object({
  page: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 1)
    .refine((val) => val > 0, 'Page must be positive'),
  limit: z.string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 10)
    .refine((val) => val > 0 && val <= 100, 'Limit must be between 1 and 100')
})

export const casesQuerySchema = paginationSchema.extend({
  industry: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  search: z.string().max(100, 'Search term too long').optional()
})

export const sessionsQuerySchema = paginationSchema.extend({
  status: z.enum(['active', 'completed', 'abandoned']).optional()
})

// Sanitization utilities
export function sanitizeHtml(input: string): string {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .trim()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 1000) // Limit length
}

// Rate limiting helpers
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

export const rateLimits = {
  auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute
  messages: { windowMs: 60 * 1000, maxRequests: 30 } // 30 messages per minute
}

// Input validation middleware helper
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      throw new Error(`Validation failed: ${JSON.stringify(formattedErrors)}`)
    }
    throw error
  }
}
