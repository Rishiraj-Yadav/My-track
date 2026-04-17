import { Router } from 'express'
import { login, me, refresh, register } from '../controllers/authController.js'
import { requireAuth } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/register', register)
authRouter.post('/login', login)
authRouter.post('/refresh', refresh)
authRouter.get('/me', requireAuth, me)
