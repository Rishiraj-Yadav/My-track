import { Router } from 'express'
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from '../controllers/expenseController.js'
import { requireAuth } from '../middleware/auth.js'

export const expenseRouter = Router()

expenseRouter.get('/', requireAuth, listExpenses)
expenseRouter.post('/', requireAuth, createExpense)
expenseRouter.patch('/:id', requireAuth, updateExpense)
expenseRouter.delete('/:id', requireAuth, deleteExpense)

