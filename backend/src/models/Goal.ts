import { Schema, model, type HydratedDocument, type InferSchemaType, Types } from 'mongoose'

const goalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    targetAmount: { type: Number, required: true },
    targetDate: { type: String, required: true },
    priority: { type: Number, enum: [1, 2, 3], required: true },
    savedAmount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export type GoalDocument = HydratedDocument<InferSchemaType<typeof goalSchema>> & {
  _id: Types.ObjectId
}

export const Goal = model('Goal', goalSchema)

