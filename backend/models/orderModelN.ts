// import { IAddress } from './userModel';
// compare aaddress later
import { model, Schema, Types } from "mongoose";
import { addressSchema, IAddress } from "./userModel";
import { IProductDimension } from "./productsModel";
export interface ICounter extends Document {
    _id: string;
    sequence: number;
}

export enum OrderType {
    Product = 'product',
    Subscription = 'subscription',
}
export type PaymentMethod = 'Prepaid' | 'COD';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'returned' | 'failed';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface IPlanSnapshot {
    _id: Types.ObjectId;
    name: string;
    price: number;
    billingInterval: string;
}

const CounterSchema = new Schema<ICounter>({
    _id: {
        type: String,
        required: true,
    },
    sequence: {
        type: Number,
        default: 0,
    },
});

export const Counter = model<ICounter>('Counter', CounterSchema);

const planSnapshotSchema = new Schema<IPlanSnapshot>({
    _id: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    billingInterval: { type: String, required: true },
}, { _id: false });

export interface IOrderItem {
    productId: Types.ObjectId;
    sku: string;
    name: string;
    priceAtPurchase: number;
    packed_dimensions: IProductDimension;
    quantity: number;
    selectedColor?: string;
    selectedSize?: string;
}
// export interface IAddressN {

//     line1: string;
//     line2: string;
//     city: number;
//     state: number;
//     pincode?: string;
//     country?: string;
//     phone?: string;
// }

const orderItemSchema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true },
    name: { type: String, required: true },
    priceAtPurchase: { type: Number, required: true },
    quantity: { type: Number, required: true },
    packed_dimensions: {
        length: { type: Number, required: true },
        width: { type: Number, required: true },
        height: { type: Number, required: true },
        weight: { type: Number, required: true },
    }
}, { _id: false });

// const addressSnapshotSchema = new Schema({
//     line1: String,
//     line2: String,
//     city: String,
//     state: String,
//     pincode: String,
//     country: String,
//     phone: String
// }, { _id: false });

export interface IOrder extends Document {
    userId: Types.ObjectId;
    // Historical Snapshots
    userSnapshot: { firstName: string; lastName?: string; email: string; phone: string };
    orderType: OrderType;
    orderNumber: string;      // your own human-readable reference, sent to Shiprocket as order_id

    items: IOrderItem[];              // orderType === 'product'
    planSnapshot?: IPlanSnapshot;
    subscriptionId?: Types.ObjectId;   // orderType === 'subscription'
    billingPeriodStart?: Date;
    billingPeriodEnd?: Date;


    shippingAddress?: IAddress;        // snapshot, not a live ref
    billingAddress: IAddress;
    totalAmount: number;
    shippingCharge: number;
    currency: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    razorpay_order_id: string;
    razorpay_payment_id: string | null;
    razorpay_signature: string | null;
    // --- Shiprocket Specifics (populate after successful shipment creation) ---
    shiprocket?: {
        order_id: number | null;       // Shiprocket's internal order id
        shipment_id: number | null;
        awb_code?: string | null;       // tracking number, set after courier assignment
        courier_name?: string | null;
        pickup_scheduled_date?: string | null;
        label_url?: string | null;
        status?: string | null;         // Shiprocket's own status string (e.g. "PICKED UP")
    };
    packageDetails?: {
        length: number;
        breadth: number;
        height: number;   // was string
        weight: number;   // was string
    };

    createdAt: Date;
    updatedAt: Date;
}
export interface IShiprocketInfo {
    order_id?: string;      // Shiprocket's internal order id (sr_order_id)
    shipment_id?: string;
    awb_code?: string;
    courier_name?: string;
    pickup_scheduled_date?: string;
    tracking_status?: string;
    label_url?: string;
}

const ShiprocketInfoSchema = new Schema<IShiprocketInfo>(
    {
        order_id: { type: String },
        shipment_id: { type: String },
        awb_code: { type: String },
        courier_name: { type: String },
        pickup_scheduled_date: { type: String, default: null },
        tracking_status: { type: String },
        label_url: { type: String },
    },
    { _id: false }
);

const orderSchema = new Schema<IOrder>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userSnapshot: {
        firstName: { type: String, required: true },
        lastName: String,
        email: { type: String, required: true },
        phone: { type: String, required: true }
    },
    orderType: { type: String, enum: Object.values(OrderType), required: true },

    items: [orderItemSchema],
    planSnapshot: planSnapshotSchema,
    subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription' },
    billingPeriodStart: Date,
    billingPeriodEnd: Date,

    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    paymentMethod: { type: String, enum: ['Prepaid', 'COD'], default: 'Prepaid', required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending', required: true },
    totalAmount: { type: Number, required: true },
    shippingCharge: { type: Number, required: true, min: 0, default: 0 },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'returned'], default: 'pending', },
    razorpay_order_id: { type: String, required: true, unique: true },
    razorpay_payment_id: { type: String, default: null },
    razorpay_signature: { type: String, default: null },
    shiprocket: { type: ShiprocketInfoSchema },


    orderNumber: { type: String, required: true, unique: true },    // your own human-readable reference, sent to Shiprocket as order_id

    packageDetails: {
        length: { type: Number, required: true },
        breadth: { type: Number, required: true },
        height: { type: Number, required: true },
        weight: { type: Number, required: true },
    },


}, { timestamps: true });

orderSchema.pre('validate', function () {
    if (this.orderType === OrderType.Product) {
        if (!this.items?.length)
            this.invalidate('items', 'Items are required for product orders');

        if (!this.shippingAddress)
            this.invalidate('shippingAddress', 'Shipping address is required');

        if (!this.packageDetails)
            this.invalidate('packageDetails', 'Package details are required');


        if (!this.orderNumber) {
            const rand = Math.floor(1000 + Math.random() * 9000);
            this.orderNumber = `ORD-${Date.now()}-${rand}`;
        }
    }

    if (this.orderType === OrderType.Subscription) {
        if (!this.planSnapshot)
            this.invalidate('planSnapshot', 'Plan snapshot is required');

        if (!this.subscriptionId)
            this.invalidate('subscriptionId', 'Subscription ID is required');

    }
});
// Your dashboard "My Orders" page will always filter by userId + sort by createdAt
orderSchema.index({ userId: 1, createdAt: -1 });


// Shiprocket webhook lookups will arrive keyed by Shiprocket's order id
orderSchema.index({ 'shiprocket.order_id': 1 }, { sparse: true });

// Subscription renewal jobs will query "find all orders for this subscription"
orderSchema.index({ subscriptionId: 1 });

// Admin/ops dashboards filtering by status (e.g. "show all shipping_failed orders")
orderSchema.index({ status: 1 });

// Tracking lookups by AWB code (customer support, tracking page)
orderSchema.index({ 'shiprocket.awb_code': 1 }, { sparse: true });


// unique: true already creates an index.Your extra line:
// orderSchema.index({ razorpay_order_id: 1 });
export default model<IOrder>("Order", orderSchema);
