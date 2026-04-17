import type { NextFunction, Request, Response } from 'express'
import { HttpError } from '../utils/httpError.js'

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, 'Route not found'))
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message })
    return
  }

  if (error instanceof Error) {
    res.status(500).json({ message: error.message })
    return
  }

  res.status(500).json({ message: 'Internal server error' })
}

