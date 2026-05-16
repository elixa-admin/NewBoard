import { useTokenData } from '../hooks/useTokenData'
import { AlertBanner } from '../components/AlertBanner'
import { Overview } from '../components/Overview'
import { ModelComparison } from '../components/ModelComparison'
import { RecommendationsPanel } from '../components/RecommendationsPanel'

export function Dashboard() {
  const { session, recommendations, feedbackState, loading, error, sendRecommendationFeedback } = useTokenData()

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-semibold">Dashboard Offline</p>
            <p className="text-red-700 text-sm mt-1">
              {error} — Check if the backend is running on http://localhost:4201
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Token Usage Dashboard</h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading...' : 'Last updated: ' + new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-8 py-8">
        {/* Alert Banner */}
        {session && session.alerts.length > 0 && (
          <AlertBanner
            level={session.alerts[0].level}
            percent={session.thresholds.session.percent}
            message={session.alerts[0].message}
          />
        )}

        {/* Overview Gauges */}
        <Overview session={session} />

        {/* Model Comparison */}
        <ModelComparison session={session} />

        {/* Recommendations */}
        <RecommendationsPanel
          recommendations={recommendations}
          feedbackState={feedbackState}
          onFeedback={sendRecommendationFeedback}
        />

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12 pt-6 border-t border-gray-200">
          <p>Token Usage Dashboard • Monitoring Claude Code sessions</p>
          <p className="mt-1">Data refreshes every 30 seconds</p>
        </div>
      </div>
    </div>
  )
}
