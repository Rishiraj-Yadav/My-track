import { z } from 'zod'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { parseSimulatorCommandWithGemini } from '../services/simulatorNlp.js'

const parseSchema = z.object({
  command: z.string().trim().min(1).max(500),
})

export const parseSimulatorCommand = asyncHandler(async (req, res) => {
  const { command } = parseSchema.parse(req.body)
  const result = await parseSimulatorCommandWithGemini(command)

  res.json({
    ...result,
    configured: Boolean(env.GEMINI_API_KEY),
  })
})
