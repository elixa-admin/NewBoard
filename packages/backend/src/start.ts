import { createApp } from './server.js'

const PORT = process.env.PORT || 4201
console.log('start.ts: creating app')
const app = createApp()
console.log('start.ts: app created, starting listen')

app.listen(PORT, () => {
  console.log('start.ts: listen callback reached')
  console.log(`Backend server running on http://localhost:${PORT}`)
  console.log(`Available endpoints:`)
  console.log(`  GET /api/health`)
  console.log(`  GET /api/session/current`)
  console.log(`  GET /api/stats/models`)
  console.log(`  GET /api/stats/projects`)
  console.log(`  GET /api/stats/trends/:timeframe`)
  console.log(`  GET /api/recommendations`)
  console.log(`  POST /api/recommendations/:id/feedback`)
})
