import { model, Schema } from "mongoose";

export interface ISubscriptionPlan extends Document {
    slug: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    billingInterval: 'weekly' | 'monthly' | 'quarterly';
    durationInCycles?: number; // omit = runs until cancelled
    features?: string[];
    thumbnail: string;
    isActive: boolean;
}
const subscriptionPlanSchema = new Schema<ISubscriptionPlan>({
    slug: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    billingInterval: { type: String, enum: ['weekly', 'monthly', 'quarterly'], required: true },
    durationInCycles: Number,
    features: [String],
    thumbnail: String,
    isActive: { type: Boolean, default: true }
}, { timestamps: true });
export default model<ISubscriptionPlan>("SubscriptionPlan", subscriptionPlanSchema);