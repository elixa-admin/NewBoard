import { SessionData } from '../hooks/useTokenData'

interface OverviewProps {
  session: SessionData | null
}

export function Overview({ session }: OverviewProps) {
  if (!session) return null

  const sessionPercent = parseFloat(session.thresholds.session.percent)
  const weeklyPercent = parseFloat(session.thresholds.weekly.percent)

  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      {/* Session Gauge */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Session Usage</h3>
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.min(sessionPercent, 100)}%` }}
            />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {session.thresholds.session.used.toLocaleString()} /{' '}
          {session.thresholds.session.capacity.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-1">{sessionPercent.toFixed(1)}% of session</p>
      </div>

      {/* Weekly Gauge */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Weekly Usage</h3>
        <div className="mb-4">
          <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all"
              style={{ width: `${Math.min(weeklyPercent, 100)}%` }}
            />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">
          {session.thresholds.weekly.used.toLocaleString()} /{' '}
          {session.thresholds.weekly.capacity.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 mt-1">{weeklyPercent.toFixed(1)}% of weekly</p>
      </div>

      {/* Session Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Session Info</h3>
        <div className="space-y-2">
          <p>
            <span className="text-gray-600">Project:</span>{' '}
            <span className="font-semibold">{session.data.project}</span>
          </p>
          <p>
            <span className="text-gray-600">Total Cost:</span>{' '}
            <span className="font-semibold">${session.data.totalCost}</span>
          </p>
          <p>
            <span className="text-gray-600">Tool Calls:</span>{' '}
            <span className="font-semibold">{session.data.callCount}</span>
          </p>
        </div>
      </div>

      {/* Time Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-semibold text-gray-600 mb-4">Started</h3>
        <p className="text-sm">
          {new Date(session.data.startedAt).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mt-2">ID: {session.data.sessionId}</p>
      </div>
    </div>
  )
}
