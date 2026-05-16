interface AlertBannerProps {
  level: 'ok' | 'warning' | 'critical'
  percent: string
  message: string
}

export function AlertBanner({ level, percent, message }: AlertBannerProps) {
  const bgColor = {
    ok: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    critical: 'bg-red-50 border-red-200',
  }[level]

  const textColor = {
    ok: 'text-green-800',
    warning: 'text-yellow-800',
    critical: 'text-red-800',
  }[level]

  const badge = {
    ok: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
  }[level]

  return (
    <div className={`border rounded-lg p-4 mb-6 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-semibold ${textColor}`}>{message}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge}`}>
          {percent}%
        </span>
      </div>
    </div>
  )
}
