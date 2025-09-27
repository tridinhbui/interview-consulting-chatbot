import { IMessage, ICaseTemplate } from '@/types'

interface AIResponse {
  content: string
  thinking?: string
  suggestions?: string[]
  score?: number
  feedback?: string
}

// Enhanced AI service with more sophisticated case interview logic
export class AIService {
  private static instance: AIService
  
  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService()
    }
    return AIService.instance
  }

  async generateResponse(
    caseTemplate: ICaseTemplate,
    messages: IMessage[],
    userMessage: string
  ): Promise<AIResponse> {
    // In production, replace with actual AI API call (OpenAI, Claude, etc.)
    // For now, we'll simulate intelligent case interview coaching
    
    const conversationHistory = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }))
    
    // Analyze conversation stage and user progress
    const stage = this.analyzeConversationStage(conversationHistory)
    const userProgress = this.assessUserProgress(conversationHistory, caseTemplate)
    
    // Generate contextual response based on case type and stage
    const response = await this.generateContextualResponse(
      caseTemplate,
      userMessage,
      stage,
      userProgress
    )
    
    return response
  }

  private analyzeConversationStage(messages: any[]): string {
    const messageCount = messages.length
    const userMessages = messages.filter(m => m.role === 'user')
    
    if (messageCount <= 2) return 'opening'
    if (messageCount <= 6) return 'problem_clarification'
    if (messageCount <= 12) return 'framework_development'
    if (messageCount <= 20) return 'analysis'
    return 'conclusion'
  }

  private assessUserProgress(messages: any[], caseTemplate: ICaseTemplate): any {
    const userMessages = messages.filter(m => m.role === 'user')
    const totalWords = userMessages.reduce((sum, m) => sum + m.content.split(' ').length, 0)
    
    // Simple scoring based on engagement and structure
    const engagementScore = Math.min(100, (totalWords / 50) * 20)
    const structureScore = this.assessStructure(userMessages)
    
    return {
      engagement: engagementScore,
      structure: structureScore,
      messageCount: userMessages.length,
      averageMessageLength: totalWords / Math.max(userMessages.length, 1)
    }
  }

  private assessStructure(userMessages: any[]): number {
    let structureScore = 0
    const content = userMessages.map(m => m.content.toLowerCase()).join(' ')
    
    // Look for structured thinking indicators
    const structureKeywords = [
      'first', 'second', 'third', 'finally',
      'hypothesis', 'assumption', 'framework',
      'revenue', 'cost', 'profit', 'market',
      'customer', 'competition', 'strategy'
    ]
    
    structureKeywords.forEach(keyword => {
      if (content.includes(keyword)) structureScore += 10
    })
    
    return Math.min(100, structureScore)
  }

  private async generateContextualResponse(
    caseTemplate: ICaseTemplate,
    userMessage: string,
    stage: string,
    progress: any
  ): Promise<AIResponse> {
    const responses = this.getResponseTemplates(caseTemplate.industry, stage)
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)]
    
    // Generate thinking process
    const thinking = this.generateThinking(userMessage, stage, progress)
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(stage, caseTemplate.industry)
    
    return {
      content: selectedResponse,
      thinking,
      suggestions,
      score: stage === 'conclusion' ? this.calculateFinalScore(progress) : undefined
    }
  }

  private getResponseTemplates(industry: string, stage: string): string[] {
    const templates = {
      opening: [
        "Great! Let's dive into this case. Can you start by clarifying what you understand about the problem?",
        "Excellent. Before we begin our analysis, what initial questions do you have about the situation?",
        "Perfect. Let's structure our approach. What framework would you use to tackle this problem?"
      ],
      problem_clarification: [
        "That's a good start. Can you be more specific about the key drivers you'd want to investigate?",
        "Interesting perspective. What assumptions are you making here, and how would you validate them?",
        "Good thinking. How would you prioritize these factors in your analysis?"
      ],
      framework_development: [
        "I like your structured approach. Can you walk me through each component of your framework?",
        "That's a solid framework. How would you adapt it specifically for this industry context?",
        "Good structure. What data would you need to test each part of your hypothesis?"
      ],
      analysis: [
        "Excellent analysis. What are the implications of these findings for our recommendation?",
        "That's insightful. How would you quantify the impact of this factor?",
        "Good point. What potential risks or challenges do you see with this approach?"
      ],
      conclusion: [
        "Great work! Can you summarize your key findings and recommendation?",
        "Excellent analysis throughout. What would be your next steps if you were presenting to the client?",
        "Well done. How confident are you in your recommendation, and what would make you more certain?"
      ]
    }
    
    return templates[stage as keyof typeof templates] || templates.analysis
  }

  private generateThinking(userMessage: string, stage: string, progress: any): string {
    const thinkingTemplates = [
      `The user is showing ${progress.structure > 70 ? 'strong' : 'developing'} structured thinking at the ${stage} stage.`,
      `Their engagement level is ${progress.engagement > 60 ? 'high' : 'moderate'} with an average message length of ${Math.round(progress.averageMessageLength)} words.`,
      `I should ${stage === 'opening' ? 'encourage framework development' : stage === 'analysis' ? 'push for deeper insights' : 'guide toward conclusions'}.`
    ]
    
    return thinkingTemplates.join(' ')
  }

  private generateSuggestions(stage: string, industry: string): string[] {
    const suggestionMap = {
      opening: [
        "Start with a structured framework",
        "Clarify the problem statement",
        "Ask about key constraints"
      ],
      problem_clarification: [
        "Define success metrics",
        "Identify key stakeholders",
        "Understand the timeline"
      ],
      framework_development: [
        "Consider market dynamics",
        "Analyze competitive landscape",
        "Evaluate internal capabilities"
      ],
      analysis: [
        "Quantify the impact",
        "Consider implementation challenges",
        "Think about risks and mitigation"
      ],
      conclusion: [
        "Summarize key insights",
        "Make a clear recommendation",
        "Outline next steps"
      ]
    }
    
    return suggestionMap[stage as keyof typeof suggestionMap] || []
  }

  private calculateFinalScore(progress: any): number {
    const engagementWeight = 0.3
    const structureWeight = 0.4
    const lengthWeight = 0.3
    
    const lengthScore = Math.min(100, (progress.messageCount / 10) * 100)
    
    return Math.round(
      progress.engagement * engagementWeight +
      progress.structure * structureWeight +
      lengthScore * lengthWeight
    )
  }

  async generateSessionFeedback(
    session: any,
    messages: IMessage[],
    caseTemplate: ICaseTemplate
  ): Promise<string> {
    const userMessages = messages.filter(m => m.role === 'user')
    const progress = this.assessUserProgress(messages, caseTemplate)
    
    const strengths = []
    const improvements = []
    
    if (progress.structure > 70) {
      strengths.push("Strong structured thinking and framework usage")
    } else {
      improvements.push("Work on developing more structured frameworks")
    }
    
    if (progress.engagement > 60) {
      strengths.push("Good engagement and detailed responses")
    } else {
      improvements.push("Try to provide more detailed analysis")
    }
    
    if (userMessages.length >= 8) {
      strengths.push("Thorough exploration of the case")
    } else {
      improvements.push("Consider asking more clarifying questions")
    }
    
    return `
**Session Feedback**

**Strengths:**
${strengths.map(s => `• ${s}`).join('\n')}

**Areas for Improvement:**
${improvements.map(i => `• ${i}`).join('\n')}

**Overall Performance:** ${progress.structure > 70 && progress.engagement > 60 ? 'Strong' : progress.structure > 50 || progress.engagement > 50 ? 'Good' : 'Developing'}

**Next Steps:** Continue practicing with similar cases and focus on developing structured problem-solving approaches.
    `.trim()
  }
}

export default AIService.getInstance()
