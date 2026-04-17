import { Router } from 'express'
import { getDashboardSummary } from '../controllers/dashboardController.js'
import { requireAuth } from '../middleware/auth.js'

export const dashboardRouter = Router()

dashboardRouter.get('/summary', requireAuth, getDashboardSummary)

