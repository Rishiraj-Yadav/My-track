import type { NextFunction, Request, Response } from 'express'

import type { IUser } from '../models/User.js'

export interface AuthRequest extends Request {
  user?: IUser | any
}

export const asyncHandler =
  (fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req as AuthRequest, res, next)).catch(next)

