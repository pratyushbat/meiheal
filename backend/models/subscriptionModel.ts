import { model, Schema, Types } from "mongoose";
import { IAddress } from "./userModel";

export interface ISubscription extends Document {
    userId: Types.ObjectId;
    planId: Types.ObjectId;
    planSnapshot: { name: string; price: number; billingInterval: string };
    status: 'active' | 'paused' | 'cancelled' | 'expired' | 'past_due';
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    razorpaySubscriptionId?: string; // Razorpay's recurring-payments product
}
const subscriptionSchema = new Schema<ISubscription>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
    planSnapshot: {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        billingInterval: { type: String, required: true }
    },
    status: { type: String, enum: ['active', 'paused', 'cancelled', 'expired', 'past_due'], default: 'active' },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    razorpaySubscriptionId: String
}, { timestamps: true });

// You'll query "which subscriptions need renewal today" constantly — index it
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });

export default model<ISubscription>("Subscription", subscriptionSchema);
