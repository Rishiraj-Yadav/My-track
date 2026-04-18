import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { User } from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

export const paymentRouter = Router()

// Since we are mocking for safety unless the user has real keys injected,
// we will instantiate Razorpay with dummy keys, but Razorpay SDK expects real formatting.
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TYpo9xlqJr9KqH',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_test_secret_for_dev_mode',
})

paymentRouter.post('/create-order', requireAuth, async (req: Request, res: Response) => {
  try {
    const { amount, tierName } = req.body

    // Note: If using the 'dummy_test_secret_for_dev_mode', the real Razorpay API will reject order.create() inside backend.
    // So for development/mock mode without active keys, we'll return a mock order ID
    // that the frontend can use to bypass the issue and open the modal gracefully.
    
    let order
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      order = await razorpay.orders.create({
        amount: amount * 100, // paise
        currency: 'INR',
        receipt: `receipt_${uuidv4()}`.substring(0, 40),
        notes: { tier: tierName }
      })
    } else {
      order = {
        id: `order_mock_${Date.now()}`,
        amount: amount * 100,
        currency: 'INR'
      }
    }

    res.json({ success: true, order })
  } catch (error: any) {
    console.error('Error creating order:', error)
    res.status(500).json({ success: false, message: error.message || 'Payment creation failed' })
  }
})

paymentRouter.post('/verify', requireAuth, async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, newTier, status } = req.body

    // Dev/mock mode verification bypass
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_test_secret_for_dev_mode'
    let isValid = false

    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET && razorpay_signature) {
      const shasum = crypto.createHmac('sha256', secret)
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`)
      const digest = shasum.digest('hex')
      isValid = digest === razorpay_signature
    } else {
      // If we are passing the mock mode order, approve it locally without crash
      isValid = (status === 'success' || !!razorpay_payment_id)
    }

    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' })
    }

    // Update user's tier
    const userId = (req as any).user.id
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    user.tier = newTier
    await user.save()

    res.json({ success: true, user })
  } catch (error: any) {
    console.error('Error verifying payment:', error)
    res.status(500).json({ success: false, message: error.message || 'Payment verification failed' })
  }
})
