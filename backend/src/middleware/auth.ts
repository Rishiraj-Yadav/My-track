import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import { User } from '../models/User.js'
import { HttpError } from '../utils/httpError.js'
import type { RequestHandler } from 'express'

type TokenPayload = {
  userId: string
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing access token')
    }

    const token = header.slice('Bearer '.length)
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload
    const user = await User.findById(payload.userId)

    if (!user) {
      throw new HttpError(401, 'User not found')
    }

    ;(req as any).user = user
    next()
  } catch (error) {
    next(error)
  }
}

