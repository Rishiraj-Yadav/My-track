import { Router } from 'express'
import {
  getChallenge,
  getBadges,
  getProfile,
  getSip,
  getTier,
  getWhatIf,
  updateBadge,
  updateChallenge,
  updateProfile,
  updateSip,
  updateTier,
  updateWhatIf,
} from '../controllers/profileController.js'
import { requireAuth } from '../middleware/auth.js'

export const profileRouter = Router()

profileRouter.get('/', requireAuth, getProfile)
profileRouter.put('/', requireAuth, updateProfile)
profileRouter.get('/sip', requireAuth, getSip)
profileRouter.put('/sip', requireAuth, updateSip)
profileRouter.get('/what-if', requireAuth, getWhatIf)
profileRouter.put('/what-if', requireAuth, updateWhatIf)
profileRouter.get('/challenge', requireAuth, getChallenge)
profileRouter.put('/challenge', requireAuth, updateChallenge)
profileRouter.get('/badges', requireAuth, getBadges)
profileRouter.put('/badges', requireAuth, updateBadge)
profileRouter.get('/tier', requireAuth, getTier)
profileRouter.put('/tier', requireAuth, updateTier)
