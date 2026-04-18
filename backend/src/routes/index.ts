import { Router } from 'express'
import { authRouter } from './authRoutes.js'
import { bootstrapRouter } from './bootstrapRoutes.js'
import { dashboardRouter } from './dashboardRoutes.js'
import { expenseRouter } from './expenseRoutes.js'
import { goalRouter } from './goalRoutes.js'
import { profileRouter } from './profileRoutes.js'
import { scenarioRouter } from './scenarioRoutes.js'
import { simulatorRouter } from './simulatorRoutes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/bootstrap', bootstrapRouter)
apiRouter.use('/profile', profileRouter)
apiRouter.use('/expenses', expenseRouter)
apiRouter.use('/goals', goalRouter)
apiRouter.use('/scenarios', scenarioRouter)
apiRouter.use('/dashboard', dashboardRouter)
apiRouter.use('/simulator', simulatorRouter)
