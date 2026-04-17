import { Router } from 'express'
import { createGoal, deleteGoal, listGoals, updateGoal } from '../controllers/goalController.js'
import { requireAuth } from '../middleware/auth.js'

export const goalRouter = Router()

goalRouter.get('/', requireAuth, listGoals)
goalRouter.post('/', requireAuth, createGoal)
goalRouter.patch('/:id', requireAuth, updateGoal)
goalRouter.delete('/:id', requireAuth, deleteGoal)

