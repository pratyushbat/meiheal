import { Schema, model } from "mongoose";

export interface IDietPlan {
  name: string;
  slug: string;
  description: string[];

  price: number;
  isDeleted: boolean
}

const dietPlanSchema = new Schema<IDietPlan>({
  name: { type: String, required: [true, "please enter name"], trim: true, },
  slug: { type: String, unique: true, lowercase: true },
  description: { type: [String], required: [true, "please enter description"] },
  price: { type: Number, index: true, required: [true, "please enter price"], },
  isDeleted: { type: Boolean, default: false },

}, { timestamps: true });

const dietPlanModel = model<IDietPlan>("dietPlan", dietPlanSchema);

export default dietPlanModel;
