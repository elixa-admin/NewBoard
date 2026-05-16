// Token usage tracking types

export interface TokenCall {
  timestamp: string // ISO 8601
  model: 'haiku' | 'sonnet' | 'opus'
  inputTokens: number
  outputTokens: number
  totalTokens: number
  tool: string // e.g., 'read', 'grep', 'test'
  taskType: 'exploration' | 'critical'
  skillsUsed: string[]
  branchName?: string
}

export interface ModelBreakdown {
  [key: string]: {
    calls: number
    tokens: number
    cost: number
  }
}

export interface Session {
  id: string
  startedAt: string // ISO 8601
  project: string
  sprint: string // YYYY-MM-DD
  activeProject: boolean
  totalTokens: number
  totalCost: number
  calls: TokenCall[]
  modelBreakdown: ModelBreakdown
}

export interface SprintStats {
  sprint: string
  totalTokens: number
  sessions: string[]
  modelBreakdown: { [key: string]: number }
  taskBreakdown: { exploration: number; critical: number }
  averageSessionLength: number
  costPerHour: number
}

export interface LimitInfo {
  window: number
  capacity: number
  resetIn: number
}

export interface Limits {
  session: LimitInfo
  weekly: LimitInfo
}

export interface Recommendation {
  id?: string
  timestamp: string
  type: 'model-switch'
  current: 'haiku' | 'sonnet' | 'opus'
  suggested: 'haiku' | 'sonnet' | 'opus'
  reason: string
  potentialSavings: number
  confidence: number
  tasksSinceLastRec: number
}

export interface RecommendationFeedback {
  recommendationId: string
  accepted: boolean
  timestamp: string
}

export interface StorageData {
  meta: {
    version: string
    lastUpdated: string
    storageVersion: number
  }
  sessions: { [key: string]: Session }
  sprints: { [key: string]: SprintStats }
  limits: Limits
  recommendations: Recommendation[]
  recommendationFeedback: RecommendationFeedback[]
}
