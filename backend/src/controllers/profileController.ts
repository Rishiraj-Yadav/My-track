import { z } from 'zod'
import { User } from '../models/User.js'
import { asyncHandler } from '../utils/asyncHandler.js'

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeProfile = (profile: {
  name?: string | null
  handle?: string | null
  pin?: string | null
  monthlySalary?: number | null
  savings?: number | null
}) => {
  const name = profile.name?.trim() ?? ''
  const handle = profile.handle?.trim() || slugify(name) || 'your-profile'

  return {
    name,
    handle,
    pin: profile.pin?.trim() ?? '',
    monthlySalary: profile.monthlySalary ?? 0,
    savings: profile.savings ?? 0,
  }
}

const profileSchema = z.object({
  name: z.string().trim().optional(),
  handle: z.string().trim().optional(),
  pin: z.string().trim().min(4).max(12).optional(),
  monthlySalary: z.coerce.number().nonnegative().optional(),
  savings: z.coerce.number().nonnegative().optional(),
})

export const getProfile = asyncHandler(async (req, res) => {
  res.json({ profile: normalizeProfile(req.user?.profile ?? {}) })
})

export const updateProfile = asyncHandler(async (req, res) => {
  const patch = profileSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  console.info('[profile:update] received', {
    userId: req.user._id.toString(),
    name: patch.name,
    handle: patch.handle,
    monthlySalary: patch.monthlySalary,
    savings: patch.savings,
    pinLength: patch.pin?.length ?? 0,
  })

  const profile = normalizeProfile({ ...req.user.profile, ...patch })
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { profile } },
    { new: true, runValidators: true },
  )

  if (!user) {
    console.warn('[profile:update] user not found after update', {
      userId: req.user._id.toString(),
    })
    res.status(404).json({ message: 'User not found' })
    return
  }

  console.info('[profile:update] saved', {
    userId: user._id.toString(),
    profile: {
      name: user.profile.name,
      handle: user.profile.handle,
      monthlySalary: user.profile.monthlySalary,
      savings: user.profile.savings,
    },
  })

  res.json({ profile: normalizeProfile(user.profile) })
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

const tierSchema = z.object({
  tier: z.enum(['starter', 'architect', 'strategist']),
})

export const getTier = asyncHandler(async (req, res) => {
  res.json({ tier: (req.user as any)?.tier ?? 'starter' })
})

export const updateTier = asyncHandler(async (req, res) => {
  const { tier } = tierSchema.parse(req.body)
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { tier } },
    { new: true, runValidators: true },
  )

  if (!user) {
    res.status(404).json({ message: 'User not found' })
    return
  }

  res.json({ tier: user.tier })
})
