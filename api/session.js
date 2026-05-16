export default function handler(req, res) {
  res.status(200).json({
    data: {
      totalTokens: 4500,
      usagePercent: 10.2,
      modelBreakdown: {
        haiku: { tokens: 1200, percent: 26.7 },
        sonnet: { tokens: 3300, percent: 73.3 }
      },
      alert: { level: 'ok' }
    }
  });
}
