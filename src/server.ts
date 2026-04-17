import { connectDb } from './config/db.js'
import { env } from './config/env.js'
import { createApp } from './app.js'

async function bootstrap() {
  await connectDb()
  const app = createApp()

  app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error)
  process.exit(1)
})

