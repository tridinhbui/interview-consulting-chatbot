import { Document } from 'mongoose'

export interface IUser extends Document {
  _id: string
  email: string
  password: string
  name: string
  role: 'user' | 'admin'
  createdAt: Date
  updatedAt: Date
}

export interface ICaseTemplate extends Document {
  _id: string
  title: string
  description: string
  industry: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  estimatedDuration: number // in minutes
  systemPrompt: string
  initialMessage: string
  tags: string[]
  isActive: boolean
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ISession extends Document {
  _id: string
  userId: string
  caseTemplateId: string
  status: 'active' | 'completed' | 'abandoned'
  startedAt: Date
  completedAt?: Date
  feedback?: string
  score?: number
  createdAt: Date
  updatedAt: Date
}

export interface IMessage extends Document {
  _id: string
  sessionId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  metadata?: {
    thinking?: string
    suggestions?: string[]
  }
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
}

export interface SessionWithTemplate extends ISession {
  caseTemplate: ICaseTemplate
}

export interface MessageWithSession extends IMessage {
  session: ISession
}
