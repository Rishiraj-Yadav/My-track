import { Schema, model, type HydratedDocument, type InferSchemaType, Types } from 'mongoose'

const expenseSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    tag: { type: String, enum: ['essential', 'avoidable', 'impulse'], required: true },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export type ExpenseDocument = HydratedDocument<InferSchemaType<typeof expenseSchema>> & {
  _id: Types.ObjectId
}

export const Expense = model('Expense', expenseSchema)

