import mongoose, { Schema } from 'mongoose'
import { ISession } from '@/types'

const SessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  caseTemplateId: {
    type: Schema.Types.ObjectId,
    ref: 'CaseTemplate',
    required: [true, 'Case template ID is required']
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  feedback: {
    type: String,
    trim: true
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
})

// Indexes for better query performance
SessionSchema.index({ userId: 1, status: 1 })
SessionSchema.index({ caseTemplateId: 1 })
SessionSchema.index({ startedAt: -1 })

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema)
