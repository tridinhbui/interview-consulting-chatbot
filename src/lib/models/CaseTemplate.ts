import mongoose, { Schema } from 'mongoose'
import { ICaseTemplate } from '@/types'

const CaseTemplateSchema = new Schema<ICaseTemplate>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Difficulty is required']
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [5, 'Duration must be at least 5 minutes'],
    max: [180, 'Duration cannot exceed 180 minutes']
  },
  systemPrompt: {
    type: String,
    required: [true, 'System prompt is required'],
    trim: true
  },
  initialMessage: {
    type: String,
    required: [true, 'Initial message is required'],
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Indexes for better query performance
CaseTemplateSchema.index({ industry: 1, difficulty: 1 })
CaseTemplateSchema.index({ isActive: 1 })
CaseTemplateSchema.index({ tags: 1 })

export default mongoose.models.CaseTemplate || mongoose.model<ICaseTemplate>('CaseTemplate', CaseTemplateSchema)
