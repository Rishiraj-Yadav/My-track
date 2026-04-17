import { Router } from 'express'
import {
  createScenario,
  deleteScenario,
  listScenarios,
  updateScenario,
} from '../controllers/scenarioController.js'
import { requireAuth } from '../middleware/auth.js'

export const scenarioRouter = Router()

scenarioRouter.get('/', requireAuth, listScenarios)
scenarioRouter.post('/', requireAuth, createScenario)
scenarioRouter.patch('/:id', requireAuth, updateScenario)
scenarioRouter.delete('/:id', requireAuth, deleteScenario)

