import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { sessionRouter, statsRouter } from './routes/stats.js'
import recommendationsRouter from './routes/recommendations.js'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    try {
      const storagePath = process.env.TOKEN_STORAGE_PATH || path.join(process.env.HOME || '', '.claude', 'token-usage.json')
      const accessible = fs.existsSync(storagePath)

      if (accessible) {
        res.json({ status: 'ok', message: 'Backend is running', storage: 'accessible' })
      } else {
        res.status(503).json({ status: 'degraded', message: 'Storage not accessible', storage: 'inaccessible' })
      }
    } catch (error) {
      res.status(503).json({ status: 'error', message: 'Health check failed' })
    }
  })

  // Routes
  app.use('/api/session', sessionRouter)
  app.use('/api/stats', statsRouter)
  app.use('/api/recommendations', recommendationsRouter)

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' })
  })

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err)
    res.status(500).json({ error: 'Internal server error' })
  })

  return app
}
