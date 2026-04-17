import { z } from 'zod'
import { asyncHandler } from '../utils/asyncHandler.js'

const profileSchema = z.object({
  name: z.string().optional(),
  pin: z.string().min(4).max(12).optional(),
  monthlySalary: z.number().nonnegative().optional(),
  savings: z.number().nonnegative().optional(),
})

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ profile: req.user?.profile })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const patch = profileSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  req.user.profile = { ...req.user.profile, ...patch }
  await req.user.save()
  res.json({ profile: req.user.profile })
})

export const getSip = asyncHandler(async (req, res) => {
  res.json({ sip: req.user?.sip })
})

const sipSchema = z.object({
  monthlyAmount: z.number().nonnegative().optional(),
  annualReturn: z.number().nonnegative().optional(),
  durationMonths: z.number().int().positive().optional(),
  delayMonths: z.number().int().nonnegative().optional(),
})

export const updateSip = asyncHandler(async (req, res) => {
  const patch = sipSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  req.user.sip = { ...req.user.sip, ...patch }
  await req.user.save()
  res.json({ sip: req.user.sip })
})

const whatIfSchema = z.object({
  whatIf: z.string(),
})

export const getWhatIf = asyncHandler(async (req, res) => {
  res.json({ whatIf: req.user?.whatIf ?? '' })
})

export const updateWhatIf = asyncHandler(async (req, res) => {
  const { whatIf } = whatIfSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  req.user.whatIf = whatIf
  await req.user.save()
  res.json({ whatIf: req.user.whatIf })
})

const challengeSchema = z.object({
  name: z.string().min(1).optional(),
  daysLeft: z.number().int().nonnegative().optional(),
  saved: z.number().nonnegative().optional(),
})

export const getChallenge = asyncHandler(async (req, res) => {
  res.json({ challenge: req.user?.challenge })
})

export const updateChallenge = asyncHandler(async (req, res) => {
  const patch = challengeSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  req.user.challenge = { ...req.user.challenge, ...patch }
  await req.user.save()
  res.json({ challenge: req.user.challenge })
})

export const getBadges = asyncHandler(async (req, res) => {
  res.json({ badges: req.user?.badges ?? [] })
})

const badgeSchema = z.object({
  id: z.string(),
  unlocked: z.boolean(),
})

export const updateBadge = asyncHandler(async (req, res) => {
  const body = badgeSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const badges = req.user.badges.map((badge) =>
    badge.id === body.id ? { ...badge, unlocked: body.unlocked } : badge,
  )
  req.user.set('badges', badges)
  await req.user.save()
  res.json({ badges: req.user.badges })
})
