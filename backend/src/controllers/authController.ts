import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'
import { loginUser, refreshUserTokens, registerUser } from '../services/auth.js'

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

const registerSchema = authSchema.extend({
  name: z.string().min(1),
})

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

const userDto = (user: any) => ({
  id: user.id,
  email: user.email,
  profile: user.profile,
  sip: user.sip,
  challenge: user.challenge,
  whatIf: user.whatIf,
  badges: user.badges,
  tier: user.tier || 'starter',
})

export const register = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body)
  const result = await registerUser(body)
  res.status(201).json({
    user: userDto(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  })
})

export const login = asyncHandler(async (req, res) => {
  const body = authSchema.parse(req.body)
  const result = await loginUser(body)
  res.json({
    user: userDto(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ user: userDto(req.user) })
})

export const refresh = asyncHandler(async (req, res) => {
  const body = refreshSchema.parse(req.body)
  const result = await refreshUserTokens(body.refreshToken)
  res.json({
    user: userDto(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  })
})
