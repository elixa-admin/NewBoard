import { Recommendation } from '../hooks/useTokenData'

interface RecommendationsPanelProps {
  recommendations: Recommendation[]
  feedbackState?: Record<string, 'idle' | 'saving' | 'saved' | 'error'>
  onFeedback?: (id: string, accepted: boolean) => void
}

export function RecommendationsPanel({
  recommendations,
  feedbackState,
  onFeedback,
}: RecommendationsPanelProps) {
  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
        <p className="text-gray-500 text-sm">
          No recommendations yet. Keep using Claude Code to gather usage patterns.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h2>
      <div className="space-y-4">
        {recommendations.map((rec) => {
          const state = feedbackState?.[rec.id] || 'idle'
          return (
          <div
            key={rec.id}
            className="border border-blue-200 bg-blue-50 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-gray-900">
                  Switch to <span className="text-blue-600">{rec.suggested}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Currently using {rec.current}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-600">
                  {(rec.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-gray-500">confidence</p>
              </div>
            </div>

            <p className="text-sm text-gray-700 mb-3">{rec.reason}</p>

            <div className="flex justify-between items-center text-sm mb-3">
              <span className="text-gray-600">
                Potential savings: <span className="font-semibold">{rec.potentialSavings} tokens</span>
              </span>
              <span className="text-gray-500 text-xs">
                {rec.tasksSinceLastRec} tasks analyzed
              </span>
            </div>

            {onFeedback && (
              <div className="flex gap-2 pt-2 border-t border-blue-100">
                <button
                  onClick={() => onFeedback(rec.id, true)}
                  disabled={state === 'saving'}
                  className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
                >
                  {state === 'saving' ? 'Saving...' : 'Accept'}
                </button>
                <button
                  onClick={() => onFeedback(rec.id, false)}
                  disabled={state === 'saving'}
                  className="flex-1 px-3 py-1 bg-gray-200 text-gray-800 text-sm font-medium rounded hover:bg-gray-300 transition"
                >
                  Ignore
                </button>
              </div>
            )}
            {state === 'saved' && (
              <p className="text-xs text-green-700 mt-3">Feedback saved and will shape future recommendations.</p>
            )}
            {state === 'error' && (
              <p className="text-xs text-red-700 mt-3">Could not save feedback yet. Try again.</p>
            )}
          </div>
          )
        })}
      </div>
    </div>
  )
}
