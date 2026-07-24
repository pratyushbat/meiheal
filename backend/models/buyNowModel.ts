import { Schema, model, Document } from 'mongoose';
import { IProductLineItemBase } from './cartModel';

export interface IBuyNowItem extends IProductLineItemBase {
    productId: string;
    priceAtPurchase: number;   // was: price

}

export interface IBuyNowSession extends Document {
    item: IBuyNowItem;
    createdAt: Date;
}

const BuyNowSessionSchema = new Schema<IBuyNowSession>({
    item: {
        productId: { type: String, required: true },
        sku: String,
        type: { type: String, enum: ['product', 'subscription'], required: true },
        slug: String,
        name: { type: String, required: true },
        brand: String,
        thumbnail: String,
        // price: { type: Number, required: true },
        priceAtPurchase: { type: Number, required: true }, // was: price
        compareAtPrice: Number,
        currency: String,
        qty: { type: Number, required: true, default: 1 },
        rating: Number,
        reviewCount: Number,
        selectedColor: String,
        selectedSize: String,
        maxStock: Number,
        billingInterval: { type: String, enum: ['monthly', 'yearly'] },
    },
    createdAt: { type: Date, default: Date.now, expires: 1800 },
});

export const BuyNowSession = model<IBuyNowSession>('BuyNowSession', BuyNowSessionSchema);