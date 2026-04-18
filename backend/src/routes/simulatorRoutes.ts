import { Router } from 'express'
import { parseSimulatorCommand } from '../controllers/simulatorController.js'
import { requireAuth } from '../middleware/auth.js'

export const simulatorRouter = Router()

simulatorRouter.post('/nlp/parse', requireAuth, parseSimulatorCommand)
