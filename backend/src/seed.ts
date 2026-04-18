/**
 * Seed Script — Realistic Indian Middle-Class User
 * ─────────────────────────────────────────────────
 * Creates a user "Arjun Mehta", a 27-year-old software engineer
 * living in Bangalore earning ₹72,000/month (₹8.64L/annum, in-hand).
 *
 * Budget reality check (monthly):
 *   Essential  : ~₹37,099   (52%)
 *   Avoidable  : ~₹13,643   (19%)
 *   Impulse    : ~₹3,437    (5%)
 *   SIP        : ₹8,000     (11%)
 *   Free cash  : ~₹9,821    (13%)  ← buffer for misc, medical, travel
 *   TOTAL      : ₹72,000
 *
 * Run:  npx tsx src/seed.ts
 */

import mongoose from 'mongoose'
import { User } from './models/User.js'
import { Expense } from './models/Expense.js'
import { Goal } from './models/Goal.js'
import { Scenario } from './models/Scenario.js'
import { env } from './config/env.js'

const SEED_SESSION_ID = 'seed-arjun-mehta-2026'

async function seed() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('🔗 Connected to MongoDB')

  // ── Wipe previous seed (idempotent) ───────────────────────────
  const existing = await User.findOne({ clientSessionId: SEED_SESSION_ID })
  if (existing) {
    await Expense.deleteMany({ userId: existing._id })
    await Goal.deleteMany({ userId: existing._id })
    await Scenario.deleteMany({ userId: existing._id })
    await User.deleteOne({ _id: existing._id })
    console.log('🗑️  Cleared previous seed data')
  }

  // ══════════════════════════════════════════════════════════════
  //  1. USER — Arjun Mehta, 27, SDE-1, Bangalore
  // ══════════════════════════════════════════════════════════════
  const user = await User.create({
    clientSessionId: SEED_SESSION_ID,
    isAnonymous: true,
    profile: {
      name: 'Arjun Mehta',
      handle: 'arjun-mehta',
      pin: '2409',
      monthlySalary: 72000,       // ₹72K in-hand — SDE-1, 3yr exp, mid-tier startup
      savings: 245000,            // ₹2.45L — built over ~2 years of working
    },
    sip: {
      monthlyAmount: 8000,        // ₹8K/mo SIP — ~11% of salary (realistic starter)
      annualReturn: 12,           // Historical Nifty-50 CAGR
      durationMonths: 180,        // 15-year horizon
      delayMonths: 0,
    },
    challenge: {
      name: 'No Swiggy Week',
      daysLeft: 3,
      saved: 1080,                // 6 days × ₹180
    },
    whatIf: 'stop Swiggy',
    badges: [
      { id: 'b1', name: 'Leak Finder', unlocked: true, hint: 'Tagged 3 expenses correctly' },
      { id: 'b2', name: 'SIP Starter', unlocked: true, hint: 'Started a monthly SIP' },
      { id: 'b3', name: 'No-Spend Week', unlocked: false, hint: '7 days under avoidable-spend target' },
      { id: 'b4', name: 'Goal Climber', unlocked: true, hint: 'Kept 2 goals on track' },
      { id: 'b5', name: 'Budget Boss', unlocked: false, hint: 'Keep avoidable spending under 15% for 3 months' },
    ],
    refreshTokenHash: '',
  })

  const userId = user._id
  console.log(`👤 Created user: Arjun Mehta (${userId})`)

  // ══════════════════════════════════════════════════════════════
  //  2. EXPENSES
  //
  //  ESSENTIAL (monthly total ≈ ₹37,099):
  //    Rent ₹16K, Groceries ₹4.5K, Electricity ₹900,
  //    Jio ₹299, Metro ₹1.4K, Gas ₹900, Insurance ₹1.1K,
  //    Parents ₹10K, WiFi ₹1K, Water ₹200, Haircut ₹300,
  //    Laundry ₹500
  //
  //  AVOIDABLE (monthly equiv ≈ ₹13,643):
  //    Swiggy ₹180/day=₹5.4K, Chai ₹60/day=₹1.8K,
  //    Dinner out ₹800/wk=₹3.4K, Uber ₹400/wk=₹1.7K,
  //    Netflix ₹149, Spotify ₹119, Hotstar ₹299,
  //    YT Premium ₹129, iCloud ₹75
  //
  //  IMPULSE (monthly equiv ≈ ₹3,437):
  //    Amazon ₹1.2K, Flipkart ₹600,
  //    Instamart ₹180/wk=₹775, Third Wave ₹200/wk=₹862
  // ══════════════════════════════════════════════════════════════
  const expenses = await Expense.insertMany([
    // ─── Essential ──────────────────
    { userId, name: 'Rent (HSR Layout 1BHK)',        amount: 16000,  frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Groceries (BigBasket + Kirana)', amount: 4500,  frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Electricity (BESCOM)',           amount: 900,   frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Mobile Recharge (Jio 299)',      amount: 299,   frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Metro Pass (Purple Line)',       amount: 1400,  frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Cooking Gas (Indane LPG)',       amount: 900,   frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Health Insurance (Star Basic)',  amount: 1100,  frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Parents Transfer (UP)',          amount: 10000, frequency: 'monthly', tag: 'essential' },
    { userId, name: 'WiFi (ACT Fibernet 100Mbps)',   amount: 1000,  frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Water Bill (BWSSB)',             amount: 200,   frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Haircut & Grooming',             amount: 300,   frequency: 'monthly', tag: 'essential' },
    { userId, name: 'Laundry (Ironwala)',             amount: 500,   frequency: 'monthly', tag: 'essential' },

    // ─── Avoidable ──────────────────
    { userId, name: 'Swiggy / Zomato Orders',        amount: 180,   frequency: 'daily',   tag: 'avoidable' },
    { userId, name: 'Chai & Snacks (Canteen)',        amount: 60,    frequency: 'daily',   tag: 'avoidable' },
    { userId, name: 'Weekend Dinner Out',             amount: 800,   frequency: 'weekly',  tag: 'avoidable' },
    { userId, name: 'Uber / Ola Rides',               amount: 400,   frequency: 'weekly',  tag: 'avoidable' },
    { userId, name: 'Netflix (Mobile Plan)',           amount: 149,   frequency: 'monthly', tag: 'avoidable' },
    { userId, name: 'Spotify Premium',                amount: 119,   frequency: 'monthly', tag: 'avoidable' },
    { userId, name: 'Hotstar (Disney+ IPL)',          amount: 299,   frequency: 'monthly', tag: 'avoidable' },
    { userId, name: 'YouTube Premium',                amount: 129,   frequency: 'monthly', tag: 'avoidable' },
    { userId, name: 'iCloud Storage (50GB)',          amount: 75,    frequency: 'monthly', tag: 'avoidable' },

    // ─── Impulse ────────────────────
    { userId, name: 'Amazon Misc (Cables, Covers)',   amount: 1200,  frequency: 'monthly', tag: 'impulse' },
    { userId, name: 'Flipkart Sale Items',            amount: 600,   frequency: 'monthly', tag: 'impulse' },
    { userId, name: 'Late-night Instamart',           amount: 180,   frequency: 'weekly',  tag: 'impulse' },
    { userId, name: 'Third Wave Coffee',              amount: 200,   frequency: 'weekly',  tag: 'impulse' },
  ])

  console.log(`💸 Created ${expenses.length} expenses`)

  // ══════════════════════════════════════════════════════════════
  //  3. GOALS
  //
  //  Reality checks:
  //   Emergency Fund : 6 × ₹72K = ₹4.32L (standard 6-month advice)
  //   Europe Trip    : 10-day budget — flights ₹55K + stay+food ₹1.4L = ~₹2L
  //   RE Himalayan   : On-road Bangalore ≈ ₹2.85L
  //   Flat Down Pmt  : 20% of ₹60L 2BHK Whitefield = ₹12L
  //   Wedding Fund   : Modest share = ₹5-6L
  //   MacBook Pro    : M4 Pro 14" base ≈ ₹1.75L
  // ══════════════════════════════════════════════════════════════
  const goals = await Goal.insertMany([
    {
      userId,
      name: 'Emergency Fund (6 months)',
      targetAmount: 432000,
      targetDate: '2027-06-30',
      priority: 1,
      savedAmount: 195000,        // 45% done — ~1.5 years of saving
    },
    {
      userId,
      name: 'Europe Trip (10 days)',
      targetAmount: 200000,
      targetDate: '2027-12-15',
      priority: 2,
      savedAmount: 28000,
    },
    {
      userId,
      name: 'Royal Enfield Himalayan 450',
      targetAmount: 285000,
      targetDate: '2028-03-01',
      priority: 2,
      savedAmount: 55000,
    },
    {
      userId,
      name: 'Down Payment — 2BHK Whitefield',
      targetAmount: 1200000,
      targetDate: '2032-01-01',
      priority: 1,
      savedAmount: 85000,
    },
    {
      userId,
      name: 'Wedding Fund',
      targetAmount: 600000,
      targetDate: '2030-06-01',
      priority: 3,
      savedAmount: 22000,
    },
    {
      userId,
      name: 'MacBook Pro M4 14"',
      targetAmount: 175000,
      targetDate: '2027-04-30',
      priority: 3,
      savedAmount: 48000,
    },
  ])

  console.log(`🎯 Created ${goals.length} goals`)

  // ══════════════════════════════════════════════════════════════
  //  4. SCENARIOS
  // ══════════════════════════════════════════════════════════════
  const scenarios = await Scenario.insertMany([
    {
      userId,
      name: 'Aggressive Saver',
      monthlySip: 15000,
      avoidableCut: 50,
      months: 180,
    },
    {
      userId,
      name: 'Current Pace',
      monthlySip: 8000,
      avoidableCut: 0,
      months: 180,
    },
    {
      userId,
      name: 'Post-Appraisal (₹88K CTC)',
      monthlySip: 12000,
      avoidableCut: 20,
      months: 180,
    },
  ])

  console.log(`🔮 Created ${scenarios.length} scenarios`)

  // ── Summary ───────────────────────────────────────────────────
  console.log('\n✅ Seed complete!')
  console.log('───────────────────────────────────────────')
  console.log(`  Session ID : ${SEED_SESSION_ID}`)
  console.log('  Salary     : ₹72,000/mo (in-hand)')
  console.log('  Savings    : ₹2,45,000')
  console.log('  SIP        : ₹8,000/mo @ 12% for 15 years')
  console.log(`  Expenses   : ${expenses.length} items`)
  console.log(`  Goals      : ${goals.length} aspirations`)
  console.log(`  Scenarios  : ${scenarios.length} plans`)
  console.log('───────────────────────────────────────────')
  console.log('')
  console.log('👉 To use this user:')
  console.log('  1. DevTools → Application → Local Storage → localhost:5173')
  console.log(`  2. Set "mytracker-session-id" → "${SEED_SESSION_ID}"`)
  console.log('  3. Delete access/refresh token keys')
  console.log('  4. Refresh')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
