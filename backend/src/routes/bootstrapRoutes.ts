import { Router } from 'express'
import { bootstrap } from '../controllers/bootstrapController.js'

export const bootstrapRouter = Router()

bootstrapRouter.post('/', bootstrap)

