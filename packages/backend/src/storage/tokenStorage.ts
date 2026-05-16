import fs from 'fs'
import path from 'path'
import { randomBytes } from 'crypto'
import type { StorageData, Session, TokenCall, SprintStats, RecommendationFeedback } from '../types.js'

const SESSION_DURATION_MS = 5 * 60 * 60 * 1000 // 5 hours
const PRO_PLAN_SESSION_LIMIT = 44000
const PRO_PLAN_WEEKLY_LIMIT = 800000

// Token costs per model (input tokens cost less than output)
const TOKEN_COSTS = {
  haiku: { input: 0.80 / 1_000_000, output: 4.0 / 1_000_000 },
  sonnet: { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  opus: { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
}

let cache: StorageData | null = null
let cacheTimestamp = 0
let cachedStoragePath: string | null = null
const CACHE_DURATION_MS = 5000

function getStoragePath(): string {
  return process.env.TOKEN_STORAGE_PATH || path.join(process.env.HOME || '', '.claude', 'token-usage.json')
}

function ensureCacheForPath(storagePath: string): void {
  if (cachedStoragePath !== storagePath) {
    cache = null
    cacheTimestamp = 0
    cachedStoragePath = storagePath
  }
}

/** Get current date as YYYY-MM-DD for sprint tracking */
function getTodaySprintDate(): string {
  return new Date().toISOString().split('T')[0]
}

/** Generate a UUID-like session ID */
function generateSessionId(): string {
  return 'session-' + Date.now() + '-' + randomBytes(4).toString('hex')
}

/** Initialize storage file if it doesn't exist */
export function initializeStorage(): void {
  try {
    const storagePath = getStoragePath()
    ensureCacheForPath(storagePath)
    const dir = path.dirname(storagePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (!fs.existsSync(storagePath)) {
      const initialData: StorageData = {
        meta: {
          version: '1.0',
          lastUpdated: new Date().toISOString(),
          storageVersion: 1,
        },
        sessions: {},
        sprints: {},
        limits: {
          session: {
            window: 0,
            capacity: PRO_PLAN_SESSION_LIMIT,
            resetIn: SESSION_DURATION_MS,
          },
          weekly: {
            used: 0,
            capacity: PRO_PLAN_WEEKLY_LIMIT,
            resetIn: 7 * 24 * 60 * 60 * 1000,
          },
        },
        recommendations: [],
        recommendationFeedback: [],
      }
      fs.writeFileSync(storagePath, JSON.stringify(initialData, null, 2))
      cache = null
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error)
    throw error
  }
}

/** Read storage file with caching */
function readStorage(): StorageData {
  const storagePath = getStoragePath()
  ensureCacheForPath(storagePath)
  const now = Date.now()
  if (cache && now - cacheTimestamp < CACHE_DURATION_MS) {
    return cache
  }

  try {
    const data = fs.readFileSync(storagePath, 'utf-8')
    const parsed = JSON.parse(data) as StorageData
    if (!parsed.recommendationFeedback) {
      parsed.recommendationFeedback = []
    }
    if (!parsed.recommendations) {
      parsed.recommendations = []
    }
    cache = parsed
    cacheTimestamp = now
    return cache
  } catch (error) {
    console.error('Failed to read storage:', error)
    throw new Error('Cannot read token storage')
  }
}

/** Write storage file atomically */
function writeStorage(data: StorageData): void {
  try {
    const storagePath = getStoragePath()
    ensureCacheForPath(storagePath)
    data.meta.lastUpdated = new Date().toISOString()
    // Write to temp file first, then atomic rename
    const tempPath = storagePath + '.tmp'
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
    fs.renameSync(tempPath, storagePath)
    cache = data
    cacheTimestamp = Date.now()
  } catch (error) {
    console.error('Failed to write storage:', error)
    throw error
  }
}

/** Calculate token cost based on model and tokens */
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = TOKEN_COSTS[model as keyof typeof TOKEN_COSTS]
  if (!costs) return 0
  return inputTokens * costs.input + outputTokens * costs.output
}

/** Get or create current session */
function getOrCreateCurrentSession(): Session {
  const data = readStorage()
  const sprint = getTodaySprintDate()
  const now = new Date().toISOString()

  // Find active session from today that's not expired
  for (const [sessionId, session] of Object.entries(data.sessions)) {
    if (session.sprint === sprint && session.activeProject) {
      const sessionStart = new Date(session.startedAt).getTime()
      const age = Date.now() - sessionStart
      if (age < SESSION_DURATION_MS) {
        return session
      }
    }
  }

  // Create new session
  const newSessionId = generateSessionId()
  const newSession: Session = {
    id: newSessionId,
    startedAt: now,
    project: process.cwd().split('/').pop() || 'unknown',
    sprint,
    activeProject: true,
    totalTokens: 0,
    totalCost: 0,
    calls: [],
    modelBreakdown: {},
  }

  data.sessions[newSessionId] = newSession
  writeStorage(data)
  return newSession
}

/** Append a token call to current session */
export function appendTokenCall(call: TokenCall): void {
  const data = readStorage()
  const session = getOrCreateCurrentSession()

  // Validate model
  if (!['haiku', 'sonnet', 'opus'].includes(call.model)) {
    call.model = 'sonnet' // default fallback
  }

  // Ensure modelBreakdown exists
  if (!session.modelBreakdown[call.model]) {
    session.modelBreakdown[call.model] = {
      calls: 0,
      tokens: 0,
      cost: 0,
    }
  }

  const cost = calculateCost(call.model, call.inputTokens, call.outputTokens)

  // Update session totals
  session.calls.push(call)
  session.totalTokens += call.totalTokens
  session.totalCost += cost
  session.modelBreakdown[call.model].calls += 1
  session.modelBreakdown[call.model].tokens += call.totalTokens
  session.modelBreakdown[call.model].cost += cost

  data.sessions[session.id] = session
  writeStorage(data)
}

/** Get current session stats */
export function getCurrentSession(): Session | null {
  const data = readStorage()
  const sprint = getTodaySprintDate()

  for (const session of Object.values(data.sessions)) {
    if (session.sprint === sprint && session.activeProject) {
      const sessionStart = new Date(session.startedAt).getTime()
      const age = Date.now() - sessionStart
      if (age < SESSION_DURATION_MS) {
        return session
      }
    }
  }
  return null
}

/** Get model breakdown for current session */
export function aggregateByModel(): { [key: string]: { calls: number; tokens: number; cost: number } } {
  const session = getCurrentSession()
  return session ? session.modelBreakdown : {}
}

/** Get sprint statistics */
export function getSprintStats(sprintDate: string): SprintStats | null {
  const data = readStorage()
  return data.sprints[sprintDate] || null
}

/** Compute usage thresholds and alerts */
export function computeThresholds(): {
  session: { used: number; capacity: number; percent: number; level: 'ok' | 'warning' | 'critical' }
  weekly: { used: number; capacity: number; percent: number; level: 'ok' | 'warning' | 'critical' }
} {
  const data = readStorage()
  const session = getCurrentSession()

  const sessionUsed = session?.totalTokens || 0
  const sessionCapacity = PRO_PLAN_SESSION_LIMIT
  const sessionPercent = (sessionUsed / sessionCapacity) * 100

  // Determine session alert level
  let sessionLevel: 'ok' | 'warning' | 'critical' = 'ok'
  if (sessionPercent >= 90) sessionLevel = 'critical'
  else if (sessionPercent >= 75) sessionLevel = 'warning'

  // For weekly, sum all sessions from past 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  let weeklyUsed = 0
  for (const sess of Object.values(data.sessions)) {
    if (sess.startedAt > sevenDaysAgo) {
      weeklyUsed += sess.totalTokens
    }
  }

  const weeklyCapacity = PRO_PLAN_WEEKLY_LIMIT
  const weeklyPercent = (weeklyUsed / weeklyCapacity) * 100

  // Determine weekly alert level
  let weeklyLevel: 'ok' | 'warning' | 'critical' = 'ok'
  if (weeklyPercent >= 90) weeklyLevel = 'critical'
  else if (weeklyPercent >= 75) weeklyLevel = 'warning'

  return {
    session: { used: sessionUsed, capacity: sessionCapacity, percent: sessionPercent, level: sessionLevel },
    weekly: { used: weeklyUsed, capacity: weeklyCapacity, percent: weeklyPercent, level: weeklyLevel },
  }
}

/** Get all storage data */
export function getAllData(): StorageData {
  return readStorage()
}

export function recordRecommendationFeedback(feedback: RecommendationFeedback): RecommendationFeedback {
  const data = readStorage()
  const existingIndex = data.recommendationFeedback.findIndex(
    (entry) => entry.recommendationId === feedback.recommendationId,
  )

  if (existingIndex >= 0) {
    data.recommendationFeedback[existingIndex] = feedback
  } else {
    data.recommendationFeedback.push(feedback)
  }

  writeStorage(data)
  return feedback
}

/** Update sprint stats (called after session ends) */
export function updateSprintStats(sprintDate: string): void {
  const data = readStorage()
  const sessionsInSprint = Object.values(data.sessions).filter((s) => s.sprint === sprintDate)

  if (sessionsInSprint.length === 0) return

  const totalTokens = sessionsInSprint.reduce((sum, s) => sum + s.totalTokens, 0)
  const modelBreakdown: { [key: string]: number } = {}
  const taskBreakdown = { exploration: 0, critical: 0 }

  for (const session of sessionsInSprint) {
    for (const [model, breakdown] of Object.entries(session.modelBreakdown)) {
      modelBreakdown[model] = (modelBreakdown[model] || 0) + breakdown.tokens
    }
    for (const call of session.calls) {
      taskBreakdown[call.taskType] += call.totalTokens
    }
  }

  const averageSessionLength = sessionsInSprint.reduce((sum, s) => {
    const latestActivity = s.calls.length > 0
      ? s.calls[s.calls.length - 1].timestamp
      : s.startedAt
    const durationHours =
      (new Date(latestActivity).getTime() - new Date(s.startedAt).getTime()) / (60 * 60 * 1000)
    return sum + Math.max(durationHours, 0)
  }, 0) / sessionsInSprint.length

  const totalCost = sessionsInSprint.reduce((sum, s) => sum + s.totalCost, 0)
  const costPerHour = averageSessionLength > 0 ? totalCost / averageSessionLength : 0

  data.sprints[sprintDate] = {
    sprint: sprintDate,
    totalTokens,
    sessions: sessionsInSprint.map((s) => s.id),
    modelBreakdown,
    taskBreakdown,
    averageSessionLength,
    costPerHour,
  }

  writeStorage(data)
}

/** Clean up old sessions (older than 30 days) */
export function cleanupOldSessions(): void {
  const data = readStorage()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  for (const sessionId of Object.keys(data.sessions)) {
    if (data.sessions[sessionId].startedAt < thirtyDaysAgo) {
      delete data.sessions[sessionId]
    }
  }

  writeStorage(data)
}
