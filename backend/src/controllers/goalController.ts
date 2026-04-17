import { z } from 'zod'
import { Goal } from '../models/Goal.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

const goalSchema = z.object({
  name: z.string().min(1),
  targetAmount: z.number().positive(),
  targetDate: z.string().min(1),
  priority: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  savedAmount: z.number().nonnegative().optional(),
})

export const listGoals = asyncHandler(async (req, res) => {
  const goals = await Goal.find({ userId: req.user?._id }).sort({ priority: 1, createdAt: -1 })
  res.json({ goals })
})

export const createGoal = asyncHandler(async (req, res) => {
  const body = goalSchema.parse(req.body)
  const goal = await Goal.create({ ...body, userId: req.user?._id })
  res.status(201).json({ goal })
})

export const updateGoal = asyncHandler(async (req, res) => {
  const patch = goalSchema.partial().parse(req.body)
  const goal = await Goal.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?._id },
    patch,
    { new: true },
  )

  if (!goal) {
    throw new HttpError(404, 'Goal not found')
  }

  res.json({ goal })
})

export const deleteGoal = asyncHandler(async (req, res) => {
  const deleted = await Goal.findOneAndDelete({
    _id: req.params.id,
    userId: req.user?._id,
  })

  if (!deleted) {
    throw new HttpError(404, 'Goal not found')
  }

  res.status(204).send()
})

