import { Schema, model, type HydratedDocument, type InferSchemaType, Types } from 'mongoose'

const scenarioSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    monthlySip: { type: Number, required: true },
    avoidableCut: { type: Number, required: true },
    months: { type: Number, required: true },
  },
  { timestamps: true },
)

export type ScenarioDocument = HydratedDocument<InferSchemaType<typeof scenarioSchema>> & {
  _id: Types.ObjectId
}

export const Scenario = model('Scenario', scenarioSchema)

