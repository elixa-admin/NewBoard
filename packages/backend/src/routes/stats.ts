import { Router } from 'express'
import {
  getCurrentSession,
  aggregateByModel,
  computeThresholds,
  getAllData,
} from '../storage/tokenStorage.js'

export const sessionRouter = Router()
export const statsRouter = Router()

/** GET /api/session/current - Current session stats with alerts */
sessionRouter.get('/current', (req, res) => {
  try {
    const session = getCurrentSession()
    const thresholds = computeThresholds()

    if (!session) {
      return res.json({
        data: null,
        alerts: [],
        message: 'No active session',
      })
    }

    // Determine alert message based on threshold level
    let alertMessage = ''
    let alertLevel = 'ok'
    if (thresholds.session.level === 'critical') {
      alertMessage = `Critical: You've used ${thresholds.session.percent.toFixed(0)}% of your session budget. New tool calls may fail.`
      alertLevel = 'critical'
    } else if (thresholds.session.level === 'warning') {
      alertMessage = `Approaching limit: ${thresholds.session.percent.toFixed(0)}% of your session allowance used. Consider lighter tasks.`
      alertLevel = 'warning'
    } else {
      alertMessage = `You're at ${thresholds.session.percent.toFixed(0)}% of your session budget. Keep working; no restrictions yet.`
      alertLevel = 'ok'
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
      alerts: alertMessage ? [{ level: alertLevel, message: alertMessage }] : [],
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/** GET /api/stats/models - Model breakdown across all sessions */
statsRouter.get('/models', (req, res) => {
  try {
    const breakdown = aggregateByModel()
    const modelStats = Object.entries(breakdown).map(([model, stats]) => ({
      model,
      calls: stats.calls,
      tokens: stats.tokens,
      cost: stats.cost.toFixed(4),
      avgTokensPerCall: stats.calls > 0 ? (stats.tokens / stats.calls).toFixed(0) : 0,
    }))

    res.json({
      data: modelStats,
      summary: {
        totalTokens: modelStats.reduce((sum, m) => sum + m.tokens, 0),
        totalCalls: modelStats.reduce((sum, m) => sum + m.calls, 0),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/** GET /api/stats/projects - Project-level aggregates */
statsRouter.get('/projects', (req, res) => {
  try {
    const data = getAllData()
    const projectMap = new Map<
      string,
      {
        project: string
        sessions: number
        totalTokens: number
        totalCost: number
        avgTokensPerSession: number
      }
    >()

    for (const session of Object.values(data.sessions)) {
      if (!projectMap.has(session.project)) {
        projectMap.set(session.project, {
          project: session.project,
          sessions: 0,
          totalTokens: 0,
          totalCost: 0,
          avgTokensPerSession: 0,
        })
      }

      const proj = projectMap.get(session.project)!
      proj.sessions += 1
      proj.totalTokens += session.totalTokens
      proj.totalCost += session.totalCost
    }

    // Calculate averages
    const projects = Array.from(projectMap.values()).map(p => ({
      ...p,
      avgTokensPerSession: p.sessions > 0 ? Math.round(p.totalTokens / p.sessions) : 0,
      totalCost: p.totalCost.toFixed(4),
    }))

    res.json({
      data: projects,
      summary: {
        projectCount: projects.length,
        totalTokens: projects.reduce((sum, p) => sum + p.totalTokens, 0),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

/** GET /api/stats/trends/:timeframe - Usage trends over time */
statsRouter.get('/trends/:timeframe', (req, res) => {
  try {
    const { timeframe } = req.params
    const data = getAllData()

    // Map timeframe to bucket size in ms
    const frameSizes: { [key: string]: number } = {
      hourly: 60 * 60 * 1000,
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
    }

    const frameSize = frameSizes[timeframe]
    if (!frameSize) {
      return res.status(400).json({ error: 'Invalid timeframe. Use: hourly, daily, weekly' })
    }

    // Bucket calls by time so trends reflect real activity instead of session start timestamps.
    const buckets = new Map<number, { tokens: number; calls: number; timestamp: string }>()

    for (const session of Object.values(data.sessions)) {
      for (const call of session.calls) {
        const callTime = new Date(call.timestamp).getTime()
        const bucketKey = Math.floor(callTime / frameSize) * frameSize
        const bucketTime = new Date(bucketKey).toISOString()

        if (!buckets.has(bucketKey)) {
          buckets.set(bucketKey, { tokens: 0, calls: 0, timestamp: bucketTime })
        }

        const bucket = buckets.get(bucketKey)!
        bucket.tokens += call.totalTokens
        bucket.calls += 1
      }
    }

    // Sort by timestamp
    const trends = Array.from(buckets.values()).sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    })

    res.json({
      data: trends,
      timeframe,
      summary: {
        totalTokens: trends.reduce((sum, t) => sum + t.tokens, 0),
        totalCalls: trends.reduce((sum, t) => sum + t.calls, 0),
        bucketsCount: trends.length,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: message })
  }
})

export default statsRouter
