import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { bootstrapAnonymousUser } from '../services/auth.js'

const bootstrapSchema = z.object({
  sessionId: z.string().min(8),
})

const userDto = (user: any) => ({
  id: user.id,
  email: user.email ?? null,
  profile: user.profile,
  sip: user.sip,
  challenge: user.challenge,
  whatIf: user.whatIf,
  badges: user.badges,
  tier: user.tier || 'starter',
})

export const bootstrap = asyncHandler(async (req, res) => {
  const { sessionId } = bootstrapSchema.parse(req.body)
  const result = await bootstrapAnonymousUser(sessionId)

  res.json({
    user: userDto(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  })
})

