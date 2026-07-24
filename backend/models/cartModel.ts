import { Schema, model, Document, Types } from 'mongoose';
import { OrderType } from './orderModelN';

export type CartItemType = 'product' | 'subscription';

export interface IProductLineItemBase {
    sku?: string;
    type: OrderType;
    slug: string;
    name: string;
    brand: string;
    thumbnail: string;
    compareAtPrice?: number;
    currency: string;
    qty: number;
    rating: number;
    reviewCount: number;
    selectedColor?: string;
    selectedSize?: string;
    maxStock?: number;
    billingInterval?: 'monthly' | 'yearly';
}

export interface ICartItem extends IProductLineItemBase {
    _id: Types.ObjectId;
    productId: Types.ObjectId;
    price: number;              // snapshot at add-time - see re-validation note in cart.controller.ts
}

export interface ICart extends Document {
    userId?: Types.ObjectId;
    sessionId?: string;
    items: Types.DocumentArray<ICartItem>;
    updatedAt: Date;
}

const CartItemSchema = new Schema<ICartItem>({
    productId: { type: Schema.Types.ObjectId, required: true, ref: 'Product' },
    type: { type: String, enum: Object.values(OrderType), required: true },
    sku: String,
    slug: { type: String, required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    thumbnail: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    currency: { type: String, required: true, default: 'INR' },
    qty: { type: Number, required: true, min: 1, default: 1 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    selectedColor: String,
    selectedSize: String,
    maxStock: Number,
    billingInterval: { type: String, enum: ['monthly', 'yearly'] },
});

const CartSchema = new Schema<ICart>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        sessionId: { type: String },
        items: [CartItemSchema],
    },
    { timestamps: true }
);
CartSchema.pre('validate', function () {
    if (!this.userId && !this.sessionId) {
        this.invalidate('user', 'Cart must have either a user or a sessionId');
    }
});
CartSchema.index({ userId: 1 }, { unique: true, sparse: true });
CartSchema.index({ sessionId: 1 }, { unique: true, sparse: true });

export const Cart = model<ICart>('Cart', CartSchema);