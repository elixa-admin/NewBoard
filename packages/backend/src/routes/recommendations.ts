import { Router } from 'express'
import { createHash } from 'crypto'
import { getAllData, recordRecommendationFeedback } from '../storage/tokenStorage.js'
import type { Recommendation } from '../types.js'

const router = Router()

/** Simple task classifier based on tool name */
function classifyTask(tool: string): 'exploration' | 'critical' {
  const explorationTools = ['read', 'grep', 'find', 'search', 'browse', 'open', 'list']
  const criticalTools = ['test', 'commit', 'deploy', 'push', 'build', 'execute', 'run']

  const lowerTool = tool.toLowerCase()
  if (explorationTools.some(t => lowerTool.includes(t))) return 'exploration'
  if (criticalTools.some(t => lowerTool.includes(t))) return 'critical'
  return 'exploration'
}

/**
 * Generate model recommendations based on historical task efficiency.
 * Recommends switching models if one is significantly more efficient.
 */
function getRecommendationId(rec: Omit<Recommendation, 'id'>): string {
  return createHash('sha1')
    .update([
      rec.type,
      rec.current,
      rec.suggested,
      rec.reason,
      rec.tasksSinceLastRec,
    ].join('|'))
    .digest('hex')
    .slice(0, 12)
}

function generateRecommendations(data: any): Recommendation[] {
  const recommendations: Recommendation[] = []
  const feedbackById = new Map(
    (data.recommendationFeedback || []).map((entry: any) => [entry.recommendationId, entry]),
  )

  // Group calls by task type and model
  const taskEfficiency: { [key: string]: { [key: string]: number[] } } = {}

  for (const session of Object.values(data.sessions)) {
    for (const call of (session as any).calls) {
      const taskType = call.taskType
      if (!taskEfficiency[taskType]) taskEfficiency[taskType] = {}
      if (!taskEfficiency[taskType][call.model]) {
        taskEfficiency[taskType][call.model] = []
      }
      taskEfficiency[taskType][call.model].push(call.totalTokens)
    }
  }

  // For each task type, check if we can recommend a switch
  for (const [taskType, models] of Object.entries(taskEfficiency)) {
    const modelEntries = Object.entries(models) as [string, number[]][]
    if (modelEntries.length < 2) continue

    // Calculate average tokens per model
    const modelAvg = modelEntries.map(([model, tokens]) => ({
      model,
      avg: tokens.reduce((a, b) => a + b, 0) / tokens.length,
      count: tokens.length,
    }))

    // Find the most efficient model
    const sorted = modelAvg.sort((a, b) => a.avg - b.avg)
    const best = sorted[0]
    const second = sorted[1]

    // If Haiku is significantly cheaper for this task, recommend it
    if (
      best.model === 'haiku' &&
      second &&
      best.count >= 2 &&
      second.count >= 2
    ) {
      const savings = second.avg - best.avg
      const savingsPercent = ((savings / second.avg) * 100).toFixed(0)
      const confidence = Math.min(0.95, 0.7 + best.count * 0.05)

      const draftRecommendation: Omit<Recommendation, 'id'> = {
        timestamp: new Date().toISOString(),
        type: 'model-switch',
        current: second.model as 'haiku' | 'sonnet' | 'opus',
        suggested: 'haiku',
        reason: `Haiku performs well on ${taskType} tasks (avg ${best.avg.toFixed(0)} tokens vs ${second.avg.toFixed(0)} for ${second.model})`,
        potentialSavings: Math.round(savings),
        confidence: confidence as any, // Type assertion for simplicity
        tasksSinceLastRec: best.count,
      }
      const id = getRecommendationId(draftRecommendation)
      const feedback = feedbackById.get(id)
      const confidenceAdjustment = feedback
        ? feedback.accepted
          ? 0.05
          : -0.05
        : 0

      recommendations.push({
        ...draftRecommendation,
        id,
        confidence: Math.max(0, Math.min(0.95, draftRecommendation.confidence + confidenceAdjustment)),
      })
    }
  }

  return recommendations
}

/** GET /api/recommendations - Active model-switch recommendations */
router.get('/', (req, res) => {
  try {
    const data = getAllData()
    const recommendations = generateRecommendations(data)

    res.json({
      data: recommendations,
      summary: {
        count: recommendations.length,
        highConfidenceCount: recommendations.filter(r => r.confidence >= 0.8).length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/** POST /api/recommendations/:id/feedback - Store user feedback on recommendation */
router.post('/:id/feedback', (req, res) => {
  try {
    const { id } = req.params
    const { accepted } = req.body

    if (typeof accepted !== 'boolean') {
      return res.status(400).json({ error: 'Invalid feedback. Expected: {accepted: boolean}' })
    }

    const feedback = recordRecommendationFeedback({
      recommendationId: id,
      accepted,
      timestamp: new Date().toISOString(),
    })

    res.json({
      success: true,
      message: `Feedback recorded: ${accepted ? 'accepted' : 'ignored'}`,
      recommendationId: id,
      feedback,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

export default router
