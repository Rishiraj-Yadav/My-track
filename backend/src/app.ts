import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler, notFound } from './middleware/error.js'
import { apiRouter } from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin || origin.startsWith('http://localhost:')) {
          callback(null, true)
        } else {
          callback(null, origin === env.CLIENT_ORIGIN)
        }
      },
      credentials: true,
    })
  )
  app.use(helmet())
  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.use('/api', apiRouter)
  app.use(notFound)
  app.use(errorHandler)

  return app
}

