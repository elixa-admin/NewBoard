import { useState, useEffect } from 'react'

export interface SessionData {
  data: {
    sessionId: string
    startedAt: string
    project: string
    totalTokens: number
    totalCost: string
    modelBreakdown: {
      [key: string]: {
        calls: number
        tokens: number
        cost: string
      }
    }
    callCount: number
  }
  thresholds: {
    session: {
      used: number
      capacity: number
      percent: string
      level: 'ok' | 'warning' | 'critical'
    }
    weekly: {
      used: number
      capacity: number
      percent: string
      level: 'ok' | 'warning' | 'critical'
    }
  }
  alerts: Array<{
    level: 'ok' | 'warning' | 'critical'
    message: string
  }>
}

export interface Recommendation {
  id: string
  timestamp: string
  type: 'model-switch'
  current: 'haiku' | 'sonnet' | 'opus'
  suggested: 'haiku' | 'sonnet' | 'opus'
  reason: string
  potentialSavings: number
  confidence: number
  tasksSinceLastRec: number
}

export function useTokenData() {
  const [session, setSession] = useState<SessionData | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [feedbackState, setFeedbackState] = useState<Record<string, 'idle' | 'saving' | 'saved' | 'error'>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setError(null)
      const [sessionRes, recRes] = await Promise.all([
        fetch('/api/session/current'),
        fetch('/api/recommendations'),
      ])

      if (!sessionRes.ok || !recRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const sessionData = await sessionRes.json()
      const recData = await recRes.json()

      setSession(sessionData)
      setRecommendations(recData.data || [])
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Fetch every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const sendRecommendationFeedback = async (id: string, accepted: boolean) => {
    setFeedbackState((current) => ({ ...current, [id]: 'saving' }))

    try {
      const response = await fetch(`/api/recommendations/${id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted }),
      })

      if (!response.ok) {
        throw new Error('Failed to save feedback')
      }

      setFeedbackState((current) => ({ ...current, [id]: 'saved' }))
      await fetchData()
    } catch (err) {
      setFeedbackState((current) => ({ ...current, [id]: 'error' }))
    }
  }

  return { session, recommendations, feedbackState, loading, error, sendRecommendationFeedback }
}
