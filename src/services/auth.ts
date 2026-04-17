import bcrypt from 'bcryptjs'
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { HttpError } from '../utils/httpError.js'

export const defaultBadges = [
  { id: 'b1', name: 'Leak Finder', unlocked: true, hint: 'Tagged 3 expenses correctly' },
  { id: 'b2', name: 'SIP Starter', unlocked: true, hint: 'Started a monthly SIP' },
  { id: 'b3', name: 'No-Spend Week', unlocked: false, hint: '7 days under avoidable-spend target' },
  { id: 'b4', name: 'Goal Climber', unlocked: false, hint: 'Kept 2 goals on track' },
]

const defaultChallenge = {
  name: 'No-spend week',
  daysLeft: 4,
  saved: 0,
}

export const createTokens = (userId: string) => {
  const accessExpiresIn = env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']
  const refreshExpiresIn = env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn']

  const accessToken = jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: accessExpiresIn,
  })
  const refreshToken = jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: refreshExpiresIn,
  })

  return { accessToken, refreshToken }
}

export const registerUser = async ({
  email,
  password,
  name,
}: {
  email: string
  password: string
  name: string
}) => {
  const existing = await User.findOne({ email })
  if (existing) {
    throw new HttpError(409, 'Account already exists')
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)
  const user = await User.create({
    email,
    passwordHash,
    isAnonymous: false,
    profile: {
      name,
      pin: '0000',
      monthlySalary: 0,
      savings: 0,
    },
    sip: {},
    challenge: defaultChallenge,
    whatIf: '',
    badges: defaultBadges,
  })

  const tokens = createTokens(user.id)
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, env.BCRYPT_SALT_ROUNDS)
  await user.save()

  return { user, ...tokens }
}

export const bootstrapAnonymousUser = async (clientSessionId: string) => {
  const existing = await User.findOne({ clientSessionId })
  const user =
    existing ??
    (await User.findOneAndUpdate(
      { clientSessionId },
      {
        $setOnInsert: {
          clientSessionId,
          isAnonymous: true,
          profile: {
            name: '',
            pin: '',
            monthlySalary: 0,
            savings: 0,
          },
          sip: {
            monthlyAmount: 0,
            annualReturn: 12,
            durationMonths: 120,
            delayMonths: 0,
          },
          challenge: defaultChallenge,
          whatIf: '',
          badges: defaultBadges,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    ))

  if (!user) {
    throw new HttpError(500, 'Unable to bootstrap session')
  }

  const tokens = createTokens(user.id)
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, env.BCRYPT_SALT_ROUNDS)
  await user.save()

  return { user, ...tokens }
}

export const loginUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  const user = await User.findOne({ email })
  if (!user) {
    throw new HttpError(401, 'Invalid credentials')
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    throw new HttpError(401, 'Invalid credentials')
  }

  const tokens = createTokens(user.id)
  user.refreshTokenHash = await bcrypt.hash(tokens.refreshToken, env.BCRYPT_SALT_ROUNDS)
  await user.save()

  return { user, ...tokens }
}
