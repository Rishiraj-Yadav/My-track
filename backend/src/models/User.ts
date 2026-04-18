import { Schema, model, type HydratedDocument, type InferSchemaType, Types } from 'mongoose'

const badgeSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    unlocked: { type: Boolean, default: false },
    hint: { type: String, required: true },
  },
  { _id: false },
)

const profileSchema = new Schema(
  {
    name: { type: String, default: '', trim: true },
    handle: { type: String, default: '', trim: true },
    pin: { type: String, default: '', trim: true },
    monthlySalary: { type: Number, default: 0 },
    savings: { type: Number, default: 0 },
  },
  { _id: false },
)

const sipSchema = new Schema(
  {
    monthlyAmount: { type: Number, default: 0 },
    annualReturn: { type: Number, default: 12 },
    durationMonths: { type: Number, default: 120 },
    delayMonths: { type: Number, default: 0 },
  },
  { _id: false },
)

const challengeSchema = new Schema(
  {
    name: { type: String, default: 'No-spend week' },
    daysLeft: { type: Number, default: 0 },
    saved: { type: Number, default: 0 },
  },
  { _id: false },
)

const userSchema = new Schema(
  {
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' },
    clientSessionId: { type: String, unique: true, sparse: true, index: true },
    isAnonymous: { type: Boolean, default: false },
    profile: { type: profileSchema, required: true },
    sip: { type: sipSchema, default: () => ({}) },
    challenge: { type: challengeSchema, default: () => ({}) },
    whatIf: { type: String, default: '' },
    badges: { type: [badgeSchema], default: [] },
    refreshTokenHash: { type: String, default: '' },
    tier: { type: String, enum: ['starter', 'architect', 'strategist'], default: 'starter' },
  },
  { timestamps: true },
)

export type IUser = HydratedDocument<InferSchemaType<typeof userSchema>> & {
  _id: Types.ObjectId
}

export const User = model('User', userSchema)
