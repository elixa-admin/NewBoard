import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { createHash, randomBytes } from 'crypto'

const app = express()
const PORT = process.env.PORT || 4201
const STORAGE_PATH = process.env.TOKEN_STORAGE_PATH || path.join(process.env.HOME || '', '.claude', 'token-usage.json')
const SESSION_DURATION_MS = 5 * 60 * 60 * 1000
const PRO_PLAN_SESSION_LIMIT = 44000
const PRO_PLAN_WEEKLY_LIMIT = 800000

const TOKEN_COSTS = {
  haiku: { input: 0.80 / 1_000_000, output: 4.0 / 1_000_000 },
  sonnet: { input: 3.0 / 1_000_000, output: 15.0 / 1_000_000 },
  opus: { input: 15.0 / 1_000_000, output: 75.0 / 1_000_000 },
}

app.use(cors())
app.use(express.json())

function getTodaySprintDate() {
  return new Date().toISOString().split('T')[0]
}

function ensureStorage() {
  const dir = path.dirname(STORAGE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  if (!fs.existsSync(STORAGE_PATH)) {
    const initialData = {
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
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(initialData, null, 2))
  }
}

function readStorage() {
  ensureStorage()
  const data = JSON.parse(fs.readFileSync(STORAGE_PATH, 'utf8'))
  if (!data.recommendations) data.recommendations = []
  if (!data.recommendationFeedback) data.recommendationFeedback = []
  return data
}

function writeStorage(data) {
  data.meta.lastUpdated = new Date().toISOString()
  const tempPath = `${STORAGE_PATH}.tmp`
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
  fs.renameSync(tempPath, STORAGE_PATH)
}

function calculateCost(model, inputTokens, outputTokens) {
  const costs = TOKEN_COSTS[model]
  if (!costs) return 0
  return inputTokens * costs.input + outputTokens * costs.output
}

function getCurrentSession(data) {
  const sprint = getTodaySprintDate()

  for (const session of Object.values(data.sessions)) {
    if (session.sprint === sprint && session.activeProject) {
      const age = Date.now() - new Date(session.startedAt).getTime()
      if (age < SESSION_DURATION_MS) {
        return session
      }
    }
  }

  return null
}

function createSeedSession(data) {
  const now = new Date()
  const sessionId = `session-${Date.now()}-${randomBytes(4).toString('hex')}`
  const session = {
    id: sessionId,
    startedAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    project: 'NewBoard',
    sprint: getTodaySprintDate(),
    activeProject: true,
    totalTokens: 0,
    totalCost: 0,
    calls: [],
    modelBreakdown: {},
  }

  const seedCalls = [
    {
      timestamp: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
      model: 'haiku',
      inputTokens: 220,
      outputTokens: 380,
      totalTokens: 600,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    },
    {
      timestamp: new Date(now.getTime() - 34 * 60 * 1000).toISOString(),
      model: 'haiku',
      inputTokens: 210,
      outputTokens: 390,
      totalTokens: 600,
      tool: 'grep',
      taskType: 'exploration',
      skillsUsed: ['grep'],
    },
    {
      timestamp: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
      model: 'sonnet',
      inputTokens: 300,
      outputTokens: 700,
      totalTokens: 1000,
      tool: 'read',
      taskType: 'exploration',
      skillsUsed: ['read'],
    },
    {
      timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      model: 'sonnet',
      inputTokens: 300,
      outputTokens: 700,
      totalTokens: 1000,
      tool: 'search',
      taskType: 'exploration',
      skillsUsed: ['search'],
    },
    {
      timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      model: 'sonnet',
      inputTokens: 450,
      outputTokens: 850,
      totalTokens: 1300,
      tool: 'test',
      taskType: 'critical',
      skillsUsed: ['test'],
    },
  ]

  for (const call of seedCalls) {
    const cost = calculateCost(call.model, call.inputTokens, call.outputTokens)
    if (!session.modelBreakdown[call.model]) {
      session.modelBreakdown[call.model] = { calls: 0, tokens: 0, cost: 0 }
    }

    session.calls.push(call)
    session.totalTokens += call.totalTokens
    session.totalCost += cost
    session.modelBreakdown[call.model].calls += 1
    session.modelBreakdown[call.model].tokens += call.totalTokens
    session.modelBreakdown[call.model].cost += cost
  }

  data.sessions[sessionId] = session
  writeStorage(data)
  return session
}

function computeThresholds(data, session) {
  const sessionUsed = session?.totalTokens || 0
  const sessionPercent = (sessionUsed / PRO_PLAN_SESSION_LIMIT) * 100
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  let weeklyUsed = 0
  for (const candidate of Object.values(data.sessions)) {
    if (candidate.startedAt > sevenDaysAgo) {
      weeklyUsed += candidate.totalTokens
    }
  }

  const weeklyPercent = (weeklyUsed / PRO_PLAN_WEEKLY_LIMIT) * 100

  const levelFor = (percent) => {
    if (percent >= 90) return 'critical'
    if (percent >= 75) return 'warning'
    return 'ok'
  }

  return {
    session: {
      used: sessionUsed,
      capacity: PRO_PLAN_SESSION_LIMIT,
      percent: sessionPercent,
      level: levelFor(sessionPercent),
    },
    weekly: {
      used: weeklyUsed,
      capacity: PRO_PLAN_WEEKLY_LIMIT,
      percent: weeklyPercent,
      level: levelFor(weeklyPercent),
    },
  }
}

function getRecommendationId(rec) {
  return createHash('sha1')
    .update([rec.type, rec.current, rec.suggested, rec.reason, rec.tasksSinceLastRec].join('|'))
    .digest('hex')
    .slice(0, 12)
}

function generateRecommendations(data) {
  const recommendations = []
  const taskEfficiency = {}
  const feedbackById = new Map((data.recommendationFeedback || []).map((entry) => [entry.recommendationId, entry]))

  for (const session of Object.values(data.sessions)) {
    for (const call of session.calls) {
      if (!taskEfficiency[call.taskType]) taskEfficiency[call.taskType] = {}
      if (!taskEfficiency[call.taskType][call.model]) taskEfficiency[call.taskType][call.model] = []
      taskEfficiency[call.taskType][call.model].push(call.totalTokens)
    }
  }

  for (const [taskType, models] of Object.entries(taskEfficiency)) {
    const modelEntries = Object.entries(models)
    if (modelEntries.length < 2) continue

    const ranked = modelEntries
      .map(([model, tokens]) => ({
        model,
        avg: tokens.reduce((sum, value) => sum + value, 0) / tokens.length,
        count: tokens.length,
      }))
      .sort((a, b) => a.avg - b.avg)

    const best = ranked[0]
    const second = ranked[1]

    if (best.model === 'haiku' && second && best.count >= 2 && second.count >= 2) {
      const draft = {
        timestamp: new Date().toISOString(),
        type: 'model-switch',
        current: second.model,
        suggested: 'haiku',
        reason: `Haiku performs well on ${taskType} tasks (avg ${best.avg.toFixed(0)} tokens vs ${second.avg.toFixed(0)} for ${second.model})`,
        potentialSavings: Math.round(second.avg - best.avg),
        confidence: Math.min(0.95, 0.7 + best.count * 0.05),
        tasksSinceLastRec: best.count,
      }
      const id = getRecommendationId(draft)
      const feedback = feedbackById.get(id)
      const adjustment = feedback ? (feedback.accepted ? 0.05 : -0.05) : 0
      recommendations.push({
        ...draft,
        id,
        confidence: Math.max(0, Math.min(0.95, draft.confidence + adjustment)),
      })
    }
  }

  return recommendations
}

app.get('/api/health', (req, res) => {
  ensureStorage()
  res.json({ status: 'ok', message: 'Preview backend is running', storage: 'accessible' })
})

app.get('/api/session/current', (req, res) => {
  const data = readStorage()
  const session = getCurrentSession(data) || createSeedSession(data)
  const thresholds = computeThresholds(data, session)

  let message = `You're at ${thresholds.session.percent.toFixed(0)}% of your session budget. Keep working; no restrictions yet.`
  if (thresholds.session.level === 'warning') {
    message = `Approaching limit: ${thresholds.session.percent.toFixed(0)}% of your session allowance used. Consider lighter tasks.`
  } else if (thresholds.session.level === 'critical') {
    message = `Critical: You've used ${thresholds.session.percent.toFixed(0)}% of your session budget. New tool calls may fail.`
  }

  res.json({
    data: {
      sessionId: session.id,
      startedAt: session.startedAt,
      project: session.project,
      totalTokens: session.totalTokens,
      totalCost: session.totalCost.toFixed(4),
      modelBreakdown: session.modelBreakdown,
      callCount: session.calls.length,
    },
    thresholds: {
      session: {
        used: thresholds.session.used,
        capacity: thresholds.session.capacity,
        percent: thresholds.session.percent.toFixed(1),
        level: thresholds.session.level,
      },
      weekly: {
        used: thresholds.weekly.used,
        capacity: thresholds.weekly.capacity,
        percent: thresholds.weekly.percent.toFixed(1),
        level: thresholds.weekly.level,
      },
    },
    alerts: [{ level: thresholds.session.level, message }],
  })
})

app.get('/api/recommendations', (req, res) => {
  const data = readStorage()
  const recommendations = generateRecommendations(data)
  res.json({
    data: recommendations,
    summary: {
      count: recommendations.length,
      highConfidenceCount: recommendations.filter((item) => item.confidence >= 0.8).length,
    },
  })
})

app.post('/api/recommendations/:id/feedback', (req, res) => {
  const { id } = req.params
  const { accepted } = req.body

  if (typeof accepted !== 'boolean') {
    res.status(400).json({ error: 'Invalid feedback. Expected: {accepted: boolean}' })
    return
  }

  const data = readStorage()
  const feedback = {
    recommendationId: id,
    accepted,
    timestamp: new Date().toISOString(),
  }
  const existingIndex = data.recommendationFeedback.findIndex((entry) => entry.recommendationId === id)
  if (existingIndex >= 0) data.recommendationFeedback[existingIndex] = feedback
  else data.recommendationFeedback.push(feedback)
  writeStorage(data)

  res.json({
    success: true,
    message: `Feedback recorded: ${accepted ? 'accepted' : 'ignored'}`,
    recommendationId: id,
    feedback,
  })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Preview backend running on http://127.0.0.1:${PORT}`)
})
