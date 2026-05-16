import { SessionData } from '../hooks/useTokenData'

interface ModelComparison {
  name: string
  calls: number
  tokens: number
  cost: string
  percent: number
}

interface ModelComparisonProps {
  session: SessionData | null
}

export function ModelComparison({ session }: ModelComparisonProps) {
  if (!session) return null

  const models: ModelComparison[] = Object.entries(session.data.modelBreakdown).map(
    ([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      calls: data.calls,
      tokens: data.tokens,
      cost: data.cost,
      percent: (data.tokens / session.data.totalTokens) * 100,
    })
  )

  const modelColors = {
    Haiku: 'bg-blue-500',
    Sonnet: 'bg-purple-500',
    Opus: 'bg-pink-500',
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Model Usage</h2>
      <div className="space-y-4">
        {models.map((model) => (
          <div key={model.name}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{model.name}</span>
              <span className="text-sm text-gray-500">
                {model.tokens.toLocaleString()} tokens • {model.calls} calls
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full ${
                  modelColors[model.name as keyof typeof modelColors] || 'bg-gray-400'
                } transition-all`}
                style={{ width: `${model.percent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">${model.cost}</span>
              <span className="text-xs text-gray-500">{model.percent.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Total: <span className="font-semibold">{session.data.totalTokens.toLocaleString()}</span> tokens •{' '}
          <span className="font-semibold">${session.data.totalCost}</span>
        </p>
      </div>
    </div>
  )
}
