import { z } from 'zod'
import { Expense } from '../models/Expense.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

const expenseSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  tag: z.enum(['essential', 'avoidable', 'impulse']),
  archived: z.boolean().optional(),
})

export const listExpenses = asyncHandler(async (req, res) => {
  const expenses = await Expense.find({ userId: req.user?._id }).sort({ createdAt: -1 })
  res.json({ expenses })
})

export const createExpense = asyncHandler(async (req, res) => {
  const body = expenseSchema.parse(req.body)
  const expense = await Expense.create({ ...body, userId: req.user?._id })
  res.status(201).json({ expense })
})

export const updateExpense = asyncHandler(async (req, res) => {
  const patch = expenseSchema.partial().parse(req.body)
  const expense = await Expense.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?._id },
    patch,
    { new: true },
  )

  if (!expense) {
    throw new HttpError(404, 'Expense not found')
  }

  res.json({ expense })
})

export const deleteExpense = asyncHandler(async (req, res) => {
  const deleted = await Expense.findOneAndDelete({
    _id: req.params.id,
    userId: req.user?._id,
  })

  if (!deleted) {
    throw new HttpError(404, 'Expense not found')
  }

  res.status(204).send()
})

