import { z } from 'zod'
import { Scenario } from '../models/Scenario.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { HttpError } from '../utils/httpError.js'

const scenarioSchema = z.object({
  name: z.string().min(1),
  monthlySip: z.number().nonnegative(),
  avoidableCut: z.number().nonnegative(),
  months: z.number().int().positive(),
})

export const listScenarios = asyncHandler(async (req, res) => {
  const scenarios = await Scenario.find({ userId: req.user?._id }).sort({ createdAt: -1 })
  res.json({ scenarios })
})

export const createScenario = asyncHandler(async (req, res) => {
  const body = scenarioSchema.parse(req.body)
  const scenario = await Scenario.create({ ...body, userId: req.user?._id })
  res.status(201).json({ scenario })
})

export const updateScenario = asyncHandler(async (req, res) => {
  const patch = scenarioSchema.partial().parse(req.body)
  const scenario = await Scenario.findOneAndUpdate(
    { _id: req.params.id, userId: req.user?._id },
    patch,
    { new: true },
  )

  if (!scenario) {
    throw new HttpError(404, 'Scenario not found')
  }

  res.json({ scenario })
})

export const deleteScenario = asyncHandler(async (req, res) => {
  const deleted = await Scenario.findOneAndDelete({
    _id: req.params.id,
    userId: req.user?._id,
  })

  if (!deleted) {
    throw new HttpError(404, 'Scenario not found')
  }

  res.status(204).send()
})

