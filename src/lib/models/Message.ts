import mongoose, { Schema } from 'mongoose'
import { IMessage } from '@/types'

const MessageSchema = new Schema<IMessage>({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: [true, 'Session ID is required']
  },
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: [true, 'Role is required']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    thinking: {
      type: String,
      trim: true
    },
    suggestions: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: false // Using custom timestamp field
})

// Indexes for better query performance
MessageSchema.index({ sessionId: 1, timestamp: 1 })
MessageSchema.index({ role: 1 })

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema)
