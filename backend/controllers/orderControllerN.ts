import { OrderType, PaymentMethod } from './../models/orderModelN';
// controllers/orderController.ts
import { NextFunction, Request, RequestHandler, Response } from 'express';

import Order, { Counter, IOrder, IOrderItem } from '../models/orderModelN';

import crypto from 'crypto';

import SubscriptionPlan from '../models/subscriptionPlan';

import Subscription from '../models/subscriptionModel';
import userModel, { IUser } from '../models/userModel';
import { createRazorpayInstance } from "../config/razorpay.config";
import User from "../models/userModel";
import { createNewUser } from './paymentController';
import { splitName } from './userController';
import Product, { IProduct } from '../models/productsModel';
import { generateSetupToken } from './paymentController';
import { Cart, ICartItem } from '../models/cartModel';
import { Document, DefaultSchemaOptions, Types } from 'mongoose';
import { of } from 'rxjs';
import axios from 'axios';
import { sendError } from '../utils/sendError';
import puppeteer from 'puppeteer';
import { OrderStatus, PaymentStatus } from '../enums/order.enum';
import { getShiprocketToken } from '../config/shipRock.token';
const razorpayInstance = createRazorpayInstance();

interface ProductCheckoutInput {
    orderType: OrderType.Product;
    user: IUser;
    items: any[];
    shippingAddress: any;
    /* added now */
    billingAddress: any;
    paymentMethod: PaymentMethod;
    sessionId: any;
    /* added now */
    guestDetails?: GuestDetails;
}

interface SubscriptionCheckoutInput {
    orderType: OrderType.Subscription;
    user: IUser;
    planId: string;
    /* added now */
    paymentMethod: PaymentMethod;
    sessionId: any;
    /* added now */
    guestDetails?: GuestDetails;
}
export class OrderControllerN {

    // SubscriptionController.subscribe — planId here, NO items/shippingAddress
    static checkPincode: RequestHandler = async (req: Request, res) => {
        const { pincode } = req.params;
        console.log('pincode', pincode)
        // Validate: Indian pincodes are exactly 6 digits
        if (!/^\d{6}$/.test(pincode as string)) {
            return res.status(400).json({ error: 'Invalid pincode. Must be 6 digits.' });
        }

        try {
            const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await response.json();
            console.log('data', data)
            if (data[0].Status !== 'Success') {
                return res.status(404).json({ error: 'Pincode not found.' });
            }

            const postOffices = data[0].PostOffice.map(po => ({
                name: po.Name,
                district: po.District,
                state: po.State,
                block: po.Block,
            }));

            return res.json({ pincode, postOffices });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Something went wrong.' });
        }
    };

    // SubscriptionController.subscribe — planId here, NO items/shippingAddress
    static checkoutSubscribe: RequestHandler = async (req, res) => {
        try {
            const { planId, guestDetails } = req.body;
            const user = (req as any).user;
            const { order, razorpayOrder } = await createCheckoutOrder({
                orderType: OrderType.Subscription,
                user,
                planId,
                paymentMethod: 'Prepaid',
                sessionId: null,
                guestDetails
            });
            return res.status(201).json({ order, razorpayOrder });
        } catch (err: any) {
            return res.status(400).json({ message: err.message || 'Failed to start subscription' });
        }
    };

    // OrderController.checkoutProduct — NO planId here at all
    static checkoutProduct: RequestHandler = async (req, res) => {
        try {
            // console.log('inside checkout')
            const { items, shippingAddress, guestDetails } = req.body;
            // console.log('inside checkout', items)
            const user = (req as any).user;
            // console.log('inside checkout', user)
            const { order, razorpayOrder } = await createCheckoutOrder({
                orderType: OrderType.Product,
                user,
                items,
                paymentMethod: 'Prepaid',
                sessionId: req.cookies?.cartSession,
                shippingAddress,
                billingAddress: shippingAddress,
                guestDetails
            });
            return res.status(201).json({ order, razorpayOrder });
        } catch (err: any) {
            console.log(err)
            return res.status(400).json({ message: err.message || 'Failed to create order' });
        }
    };
    // OrderController.checkoutProduct — NO planId here at all
    static createShipmentTemp: RequestHandler = async (req, res) => {
        try {
            // const orderId = Array.isArray(req.params.orderId)    ? req.params.orderId[0]    : req.params.orderId;
            let orderId: string = req.params.orderId as string;
            if (orderId) {
                await createShiprocketShipment(orderId);
                const order = await Order.findById(orderId);
                return res.status(200).json({ success: true, order });

            }
            else
                return res.status(400).json({ success: true, message: 'orderidd not foundd' });
        } catch (err: any) {
            return res.status(500).json({
                success: false,
                error: err.response?.data || err.message
            });
        }
    };


    static verifyPayment: RequestHandler = async (req, res) => {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            const expectedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
                .update(`${razorpay_order_id}|${razorpay_payment_id}`)
                .digest('hex');

            if (expectedSignature !== razorpay_signature) {
                return res.status(400).json({ message: 'Invalid payment signature' });
            }

            const order = await Order.findOne({ razorpay_order_id });
            if (!order) return res.status(404).json({ message: 'Order not found' });

            if (order.paymentStatus === PaymentStatus.Paid) {
                // already processed — don't regenerate token, just return existing flow state
                return res.status(200).json({ success: true, message: "Payment already verified for this order" });
            }

            let user: any = await userModel.findById(order.userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found" });
            }


            order.razorpay_payment_id = razorpay_payment_id;
            order.razorpay_signature = razorpay_signature;

            // Re-check stock NOW, at the moment money is actually confirmed — not
            // trusting the check done at order creation, since time has passed and
            // another customer could have bought the last units in the meantime.
            for (const item of order.items) {
                const product = await Product.findOne({ _id: item.productId, 'variants.sku': item.sku });
                const variant = product?.variants.find((v) => v.sku === item.sku);
                if (!variant || variant.stock < item.quantity) {
                    // Payment succeeded but stock ran out in the meantime — this needs a
                    // refund flow, flagging rather than silently failing.
                    order.paymentStatus = PaymentStatus.Paid;
                    order.status = OrderStatus.Cancelled;
                    await order.save();
                    return res.status(409).json({
                        message: `Stock for ${item.sku} ran out after payment — order cancelled, refund required`,
                        order,
                    });
                }
            }

            for (const item of order.items) {
                // await Product.updateOne(
                //     { _id: item.productId, 'variants.sku': item.sku },
                //     { $inc: { 'variants.$.stock': -item.quantity } }
                // );
                const result = await Product.updateOne(
                    { _id: item.productId, variants: { $elemMatch: { sku: item.sku, stock: { $gte: item.quantity } } } },
                    [
                        {
                            $set: {
                                variants: {
                                    $map: {
                                        input: '$variants',
                                        as: 'v',
                                        in: {
                                            $cond: [
                                                { $eq: ['$$v.sku', item.sku] },
                                                { $mergeObjects: ['$$v', { stock: { $subtract: ['$$v.stock', item.quantity] } }] },
                                                '$$v'
                                            ]
                                        }
                                    }
                                }
                            }
                        },
                        { $set: { stock: { $sum: '$variants.stock' } } } // recompute top-level stock in the same atomic op
                    ], { updatePipeline: true }
                );
                if (result.matchedCount === 0) {
                    // Stock ran out between order creation and payment confirmation.
                    // Payment already succeeded — this needs a refund flow, not a silent failure.
                    order.paymentStatus = PaymentStatus.Paid;
                    order.status = OrderStatus.Cancelled;
                    await order.save();
                    return res.status(409).json({
                        message: `Stock for ${item.sku} ran out after payment — order cancelled, refund required`,
                    });
                }
            }


            order.paymentStatus = PaymentStatus.Paid;
            order.status = OrderStatus.Confirmed;

            const { rawToken, hashedToken, expiresAt } = generateSetupToken();
            if (user.isGuest) {

                user.setupToken = hashedToken;       // store hashed version, never raw
                user.setupTokenExpire = expiresAt;
                user.isGuest = false;
            }
            await user.save();

            if (order.orderType === 'subscription') {
                const planSnapshot = (order as any).planSnapshot; // see note above
                const subscription = await new Subscription({
                    userId: order.userId,
                    planId: planSnapshot._id,
                    planSnapshot: {
                        name: planSnapshot.name,
                        price: planSnapshot.price,
                        billingInterval: planSnapshot.billingInterval,
                    },
                    status: 'active',
                    currentPeriodStart: order.billingPeriodStart,
                    currentPeriodEnd: order.billingPeriodEnd,
                    cancelAtPeriodEnd: false,
                }).save();
                order.subscriptionId = subscription._id;
            }
            let savedOrder = await order.save();

            if (order?.userId) {
                await Cart.findOneAndUpdate({ userId: order.userId }, { items: [] });
            } else if (req.cookies?.cartSession) {
                await Cart.findOneAndUpdate({ sessionId: req.cookies.cartSession }, { items: [] });
            }
            // fire-and-forget or await — push to Shiprocket
            /*   if (savedOrder.orderType === 'product') {
                  // await createShiprocketShipment(savedOrder);
                  // Want me to write the BullMQ queue + worker setup for this, so the payment response returns instantly and Shiprocket sync happens in the background with retries?
                  // Important: don't call Shiprocket inline in the request cycle
  
                  await shiprocketQueue.add('create-shipment', { orderId: order._id.toString() });
  
  
              } */
            return res.status(200).json({ success: true, message: "Payment successful and order updated.", order, token: rawToken });
        } catch (err: any) {
            return res.status(500).json({ message: err.message || 'Payment verification failed' });
        }
    };

    // --- Push an existing order to Shiprocket for fulfillment ---
    static shipOrder = async (req: Request, res: Response) => {
        try {
            const { orderId } = req.params;
            const order = await Order.findById(orderId);
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            if (order.shiprocket?.order_id) {
                return res.status(400).json({ message: 'Order already pushed to Shiprocket' });
            }

            const token = await getShiprocketToken();
            const dims = resolveShipmentDimensions(order.items);

            const payload = {
                order_id: order.orderNumber,
                order_date: order.createdAt.toISOString().slice(0, 16).replace('T', ' '),
                pickup_location: 'Primary',
                billing_customer_name: order.billingAddress.fullName,  //name
                billing_address: order.billingAddress.address,
                billing_city: order.billingAddress.city,
                billing_pincode: order.billingAddress.pincode,
                billing_state: order.billingAddress.state,
                billing_country: order.billingAddress.country,
                billing_email: order.userSnapshot.email,
                billing_phone: order.billingAddress.phone,
                shipping_is_billing: true,
                order_items: order.items.map((i) => ({
                    name: i.name,
                    sku: i.sku,
                    units: i.quantity,
                    selling_price: i.priceAtPurchase,
                })),
                payment_method: order.paymentMethod,
                sub_total: order.totalAmount,
                length: dims.length,
                breadth: dims.width,
                height: dims.height,
                weight: dims.weight,
            };

            const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (!data.order_id) {
                return res.status(502).json({ message: 'Shiprocket order creation failed', details: data });
            }

            order.shiprocket = {
                order_id: data.order_id,
                shipment_id: data.shipment_id,

            };
            order.status = 'confirmed';
            await order.save();

            return res.json({ message: 'Order shipped to Shiprocket', order });
        } catch (err: any) {
            console.error('shipOrder error:', err);
            return res.status(500).json({ message: 'Failed to push order to Shiprocket' });
        }
    };


    static myOrders: RequestHandler = async (req, res) => {
        const userId = (req as any).user._id;
        const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
        return res.status(200).json(orders);
    };

    static getByUserId: RequestHandler = async (req, res) => {
        const userId = (req as any).user._id;
        const order = await Order.find({ _id: req.params.id, userId }).lean();
        if (!order) return res.status(404).json({ message: 'Order not found' });
        return res.status(200).json(order);
    };
    static getByUserIdPdf: RequestHandler = async (req, res) => {
        const userId = (req as any).user._id;
        const order = await Order.findOne({ _id: req.params.id, userId }).lean();
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const generateInvoiceHtml = (order) => `
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <script src="https://cdn.tailwindcss.com"></script>
                        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
                        <style>
                            body { font-family: 'Inter', sans-serif; }
                            /* Forces the table border to print perfectly */
                            table { page-break-inside: auto; }
                            tr { page-break-inside: avoid; page-break-after: auto; }
                        </style>
                    </head>
                    <body class="bg-white text-gray-800 p-10">

                        <div class="flex justify-between items-start border-b pb-8 mb-8">
                            <div>
                                <h1 class="text-3xl font-bold text-emerald-600 tracking-tight">MeiHeal</h1>
                                <p class="text-sm text-gray-500 mt-1">Health & Nutrition</p>
                            </div>
                            <div class="text-right">
                                <h2 class="text-2xl font-bold text-gray-900">INVOICE</h2>
                                <p class="text-sm text-gray-500 mt-1">#${order._id || order.id}</p>
                                <p class="text-sm text-gray-500">Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        <div class="mb-10">
                            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To:</h3>
                            <p class="text-lg font-semibold text-gray-900">${order.userSnapshot?.firstName} ${order.userSnapshot?.lastName}</p>
                            <p class="text-sm text-gray-600">${order.userSnapshot?.email}</p>
                            <p class="text-sm text-gray-600">${order.userSnapshot?.phone}</p>
                        </div>

                        <div class="mb-10">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="border-b-2 border-gray-200">
                                        <th class="py-3 font-semibold text-gray-700">Description</th>
                                        <th class="py-3 font-semibold text-gray-700 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr class="border-b border-gray-100">
                                        <td class="py-4">
                                            <p class="font-medium text-gray-900">${order.productSnapshot?.name}</p>
                                            <p class="text-sm text-gray-500">Digital Purchase</p>
                                        </td>
                                        <td class="py-4 text-right font-medium text-gray-900">
                                            ${order.totalAmount} ${order.currency}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="flex justify-end mb-12">
                            <div class="w-1/2 bg-gray-50 rounded-lg p-6">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-gray-600 leading-relaxed">Subtotal</span>
                                    <span class="font-medium">${order.totalAmount} ${order.currency}</span>
                                </div>
                                <div class="flex justify-between items-center border-t border-gray-200 mt-4 pt-4">
                                    <span class="text-lg font-bold text-gray-900">Total Paid</span>
                                    <span class="text-xl font-bold text-emerald-600">${order.totalAmount} ${order.currency}</span>
                                </div>
                            </div>
                        </div>

                        <div class="border-t pt-8 text-center text-sm text-gray-500">
                            <p>Thank you for choosing us for your health journey!</p>
                            <p class="mt-1">If you have any questions, contact www.meiheal.com.com</p>
                        </div>

                    </body>
                    </html>
        `;
        const pdfBuffer = await generateInvoicePDF(generateInvoiceHtml(order));
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${userId}.pdf`);
        return res.send(pdfBuffer);
    };

    static orderById: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const order = await Order.findById(id);
            if (!order)
                return res.status(404).json({ success: false, message: "Order not found." });

            // 3. Return the order data to Angular
            return res.status(200).json({ success: true, data: order });

        } catch (error: any) {
            return sendError(res, 400, "Failed To GetData Order 🙄", error?.message);
        }
    };

    // --- Webhook: Shiprocket pushes tracking updates here ---
    static shiprocketWebhook = async (req: Request, res: Response) => {
        try {
            const incomingToken = req.headers['x-api-key'];
            if (incomingToken !== process.env.SHIPROCKET_WEBHOOK_TOKEN) {
                return res.status(401).send('Unauthorized');
            } const payload = JSON.parse(req.body.toString('utf8'));
            console.log('Ship rocket Webhook payload:', payload);
            const { order_id, awb, current_status, courier_name } = req.body;

            await Order.updateOne(
                { orderNumber: order_id },
                {
                    $set: {
                        'shiprocket.awb_code': awb,
                        'shiprocket.tracking_status': current_status,
                        'shiprocket.courier_name': courier_name,
                    },
                }
            );

            return res.status(200).send('OK'); // Shiprocket expects a 200 response
        } catch (err: any) {
            console.error('shiprocketWebhook error:', err);
            return res.status(500).send('Error');
        }
    };



}

export async function createCheckoutOrder(input: ProductCheckoutInput | SubscriptionCheckoutInput) {


    const wasLoggedIn = Boolean(input.user);
    // console.log('input', input)
    const user = await resolveUser(input.user, input.guestDetails);
    // console.log('createCheckoutOrder user received :', user)
    // Match your actual Cart model's field names (userId/sessionId, not user).
    console.log('sessionid', JSON.stringify(input.sessionId))


    // console.log(carte);
    const cartQuery = wasLoggedIn ? { userId: user._id } : { sessionId: input.sessionId.trim() };
    console.log('cartQuery', cartQuery)
    const cart = await Cart.findOne(cartQuery);
    if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
    }


    let totalAmount: number;
    let orderPayload: Partial<IOrder> = {
        userId: user._id,
        userSnapshot: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
        },
        orderType: OrderType.Product,
        currency: 'INR',
        status: 'pending',
    };
    // console.log(input)
    if (input.orderType === OrderType.Product) {
        // totalAmount = input.items.reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0);
        // const verifiedItems = await Promise.all(
        //     input.items.map(async (item) => {
        //         const product = await Product.findById(item.productId);
        //         if (!product) throw new Error(`Product ${item.productId} no longer available`);
        //         console.log('product', product)
        //         /* aded now */
        //         const variant = product.variants.find((v) => v.sku === cartItem.sku);

        //         /* aded now */
        //         const priceN = Number(product.price);

        //         if (Number.isNaN(priceN)) {
        //             throw new Error(`Invalid price for product ${item.productId}`);
        //         }
        //         return {
        //             productId: item.productId,
        //             sku: item.sku,
        //             name: item.name,
        //             priceAtPurchase: priceN, // live price, not the cart's stale snapshot
        //             qty: item.qty,
        //             selectedColor: item.selectedColor,
        //             selectedSize: item.selectedSize,
        //         };
        //     })
        // );


        // console.log('verifiedItems', verifiedItems)
        // totalAmount = verifiedItems.reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0);
        // console.log('totalAmount', totalAmount)
        const orderItems: IOrderItem[] = [];
        for (const cartItem of cart.items) {
            if (cartItem.type === OrderType.Subscription) {
                // Subscriptions likely need separate handling (recurring billing,
                // no packed_dimensions/shipping) — skipping in this pass, flag if
                // you want subscriptions to also produce shippable order items.
                continue;
            }
            const product = await Product.findById(cartItem.productId);
            if (!product)
                throw new Error('A product in your cart is no longer available');

            const variant = product.variants.find((v) => v.sku === cartItem.sku);
            if (!variant)
                throw new Error(`Variant ${cartItem.sku} no longer exists`);

            if (variant.stock < cartItem.qty)
                throw new Error(`${product.name} (${cartItem.sku}) has only ${variant.stock} units left`);


            orderItems.push({
                productId: product._id,
                sku: variant.sku,
                name: product.name,
                quantity: cartItem.qty,                        // your cart uses `qty`
                priceAtPurchase: variant.price,                           // re-verified live price, not cart's stored snapshot
                packed_dimensions: variant.packed_dimensions,
            });
        }

        if (orderItems.length === 0) {
            throw new Error('No shippable items in cart');
        }
        // totalAmount = verifiedItems.reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0);
        // totalAmount is noww subTotak
        const subTotal = orderItems.reduce((sum, i) => sum + i.priceAtPurchase * i.quantity, 0);
        const shippingCharge = 0; // wire up your real shipping rate calc here
        totalAmount = subTotal + shippingCharge;
        // orderPayload.items = input.items;

        orderPayload.items = orderItems;

        input.shippingAddress.phone = orderPayload?.userSnapshot?.phone;
        orderPayload.shippingAddress = input.shippingAddress;
        orderPayload.billingAddress = input.shippingAddress;
        const counter = await Counter.findOneAndUpdate(
            { _id: "order" },
            { $inc: { sequence: 1 } },
            { new: true, upsert: true }
        );
        const orderNumber = `DVJ-${counter.sequence}`;
        orderPayload.orderNumber = orderNumber;
        const packageDetails = await buildPackageDetails(cart.items);
        orderPayload.packageDetails = packageDetails;
        console.log('orderPayload', orderPayload)
    } else {
        const plan = await SubscriptionPlan.findById(input.planId).lean();
        if (!plan || !plan.isActive) {
            throw new Error('Subscription plan not found or inactive');
        }
        totalAmount = plan.price;
        orderPayload.totalAmount = plan.price;
        // console.log('totalAmount in SubscriptionPlan', totalAmount)
        // console.log('Math.round(totalAmount * 100)', Math.round(totalAmount * 100))
        orderPayload.planSnapshot = plan; // for reference during webhook processing
        orderPayload.billingPeriodStart = new Date();
        orderPayload.billingPeriodEnd = computePeriodEnd(new Date(), plan.billingInterval);
    }

    // console.log('-----orderPayload before razrrpa SAaavinf', orderPayload)
    console.log('reached heree to create order')
    if (!totalAmount || totalAmount <= 0 || Number.isNaN(totalAmount)) {
        throw new Error('Invalid order total — cannot create payment order');
    }
    console.log('totalAmount in', totalAmount)
    console.log('reached razorpayOrder Pgae')
    const razorpayOrder = await razorpayInstance.orders.create({
        amount: Math.round(totalAmount * 100), // paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
    });
    console.log(razorpayOrder);
    orderPayload.totalAmount = totalAmount;
    orderPayload.razorpay_order_id = razorpayOrder.id;
    orderPayload.razorpay_payment_id = null;
    orderPayload.razorpay_signature = null;
    orderPayload.paymentStatus = PaymentStatus.Pending;
    orderPayload.status = OrderStatus.Pending;

    console.log('orderPayload VBEFORE SAaavinf', orderPayload)
    const savedOrder = await new Order(orderPayload).save();
    // cart.items = cart.items.filter((i) => i.type === OrderType.Subscription); // keep subs, clear the rest
    for (let i = cart.items.length - 1; i >= 0; i--) {
        if (cart.items[i].type !== OrderType.Subscription) {
            cart.items.splice(i, 1);
        }
    }
    console.log('cart.items', cart.items)
    await cart.save();

    return { order: savedOrder, razorpayOrder };
}

export function computePeriodEnd(start: Date, interval: 'weekly' | 'monthly' | 'quarterly'): Date {
    const end = new Date(start);
    if (interval === 'weekly') end.setDate(end.getDate() + 7);
    if (interval === 'monthly') end.setMonth(end.getMonth() + 1);
    if (interval === 'quarterly') end.setMonth(end.getMonth() + 3);
    return end;
}

interface GuestDetails {
    email: string;
    firstName: string;
    lastName?: string;
    fullName: string;
    phone: string;
}

async function resolveUser(reqUser: any, guestDetails?: GuestDetails) {
    if (reqUser) return reqUser; // logged-in path, unchanged

    if (!guestDetails?.email) {
        throw new Error("Email is required for guest checkout");
    }

    let user = await User.findOne({ email: guestDetails.email });
    if (!user) {
        const setupToken = crypto.randomBytes(20).toString('hex');
        const hashedSetupToken = crypto.createHash('sha256').update(setupToken).digest('hex');
        const setupTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const { firstName, lastName } = splitName(guestDetails.fullName);
        //  if (lastName) user.lastName = lastName;
        user = await createNewUser(
            setupToken,
            hashedSetupToken,
            setupTokenExpire,
            firstName,
            // `${guestDetails.firstName} ${guestDetails.lastName || ''}`.trim(),
            guestDetails.email,
            guestDetails.phone
        );
    }
    const phone = user.addresses?.[0]?.phone;
    if (!user.phone && phone) {
        user.phone = phone;
        return await user.save();
    }
    return user;

}

/* async function createShiprocketShipment(orderId: string) {
    // return of(null);
    const order = await Order.findById(orderId);
    if (!order || order.orderType !== 'product') return;

    const token = await getShiprocketToken();

    try {
        let mappedOrder = order.items.map(item => ({
            name: item.name,
            sku: item.sku,
            units: item.qty,
            selling_price: item.priceAtPurchase
        }))
        // Step 1: create order on Shiprocket
        const { data } = await axios.post(
            'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
            {
                order_id: order._id.toString(),
                order_date: order.createdAt,
                pickup_location: 'Primary',
                billing_customer_name: order.userSnapshot.firstName,
                billing_last_name: order.userSnapshot.lastName || '',
                billing_address: order.shippingAddress.line1,
                billing_address_2: order.shippingAddress.line2 || '',
                billing_city: order.shippingAddress.city,
                billing_pincode: order.shippingAddress.pincode,
                billing_state: order.shippingAddress.state,
                billing_country: order.shippingAddress.country || 'India',
                billing_email: order.userSnapshot.email,
                billing_phone: order.userSnapshot.phone,
                shipping_is_billing: true,
                order_items: mappedOrder,
                payment_method: order.paymentMethod,
                sub_total: order.totalAmount,
                length: order.packageDetails?.length,
                breadth: order.packageDetails?.breadth,
                height: order.packageDetails?.height,
                weight: order.packageDetails?.weight
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        // Step 2: persist Shiprocket's returned IDs
        order.shiprocket = {
            order_id: data.order_id,
            shipment_id: data.shipment_id,
            awb_code: null,
            courier_name: null,
            pickup_scheduled_date: null,
            label_url: null,
            status: data.status || null
        };
        await order.save();

        // Step 3: assign AWB
        const awbRes = await axios.post(
            'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
            { shipment_id: data.shipment_id },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        order.shiprocket.awb_code = awbRes.data.response.data.awb_code;
        order.shiprocket.courier_name = awbRes.data.response.data.courier_name;
        order.status = 'shipped';
        await order.save();

    } catch (err: any) {
        // don't leave the order silently un-shipped
        order.status = 'failed';
        order.shiprocket = order.shiprocket || {};
        order.shiprocket.status = 'sync_failed';
        await order.save();
        console.error('Shiprocket sync failed:', err.response?.data || err.message);
        throw err;
    }

    // console.log('order', order)
    // // Step 3 — Create the order on Shiprocket
    // let body = {
    //     order_id: order._id.toString(),      // your reference id
    //     order_date: order.createdAt,
    //     pickup_location: "Primary",          // set up in Shiprocket dashboard
    //     billing_customer_name: order.userSnapshot.firstName,
    //     billing_last_name: order.userSnapshot.lastName,
    //     billing_address: order.shippingAddress.address,
    //     billing_city: order.shippingAddress.city,
    //     billing_pincode: order.shippingAddress.pincode,
    //     billing_state: order.shippingAddress.state,
    //     billing_country: order.shippingAddress.country,
    //     billing_email: order.userSnapshot.email,
    //     billing_phone: order.userSnapshot.phone,
    //     shipping_is_billing: true,
    //     order_items: [{
    //         name: order.productSnapshot.name,
    //         sku: order.productSnapshot.sku,
    //         units: 1,
    //         selling_price: order.productSnapshot.priceAtPurchase
    //     }],
    //     payment_method: order.paymentMethod,
    //     sub_total: order.totalAmount,
    //     length: order.packageDetails.length,
    //     breadth: order.packageDetails.breadth,
    //     height: order.packageDetails.height,
    //     weight: order.packageDetails.weight
    // };

    // const response = await fetch(`https://apiv2.shiprocket.in/v1/external/orders/create/adhoc`, body);
    // const data = await response.json();
    // // Save the returned order_id and shipment_id into order.shiprocket.
    // // order.shiprocket.order_id = assignAwbName.order_id;
    // // order.shiprocket.shipment_id = assignAwbName.shipment_id;

    // // Step 4 — Assign AWB (courier + tracking number)
    // const assignAwbName = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/assign/awb`, { shipment_id: order.shiprocket.shipment_id });
    // // Save awb_code and courier_name back to the order, set status: 'shipped'.
    // // order.shiprocket.awb_code = assignAwbName.awb_code;
    // // order.shiprocket.courier_name = assignAwbName.courier_name;

    // // Step 5 — Schedule pickup
    // const generatePickup = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/generate/pickup`, { shipment_id: order.shiprocket.shipment_id });



    // // Step 6 — Generate label (optional, can be done anytime after AWB assignment)
    // const label_url = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/generate/label`, { shipment_id: order.shiprocket.shipment_id });
    // // Save the returned label URL to order.shiprocket.label_url.
    // order.shiprocket.label_url = label_url;
} */


async function generateInvoicePDF(htmlString: string) {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        ignoreDefaultArgs: ['--disable-extensions'],
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Helps prevent memory-related crashes in GCP
            '--disable-gpu'
        ]
    });
    const page = await browser.newPage();
    await page.setContent(htmlString, { waitUntil: 'domcontentloaded' });
    await page.waitForNetworkIdle({
        idleTime: 500, // Wait for 500ms of zero network activity
        timeout: 30000 // Give up if it takes longer than 30 seconds
    });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true // Ensures CSS backgrounds/colors print
    });
    await browser.close();
    return pdfBuffer;
}


export function resolveShipmentDimensions(items: IOrderItem[]) {
    let totalWeight = 0;
    let maxLength = 0;
    let maxWidth = 0;
    let totalHeight = 0;

    for (const item of items) {
        const d = item.packed_dimensions;
        totalWeight += d.weight * item.quantity;
        maxLength = Math.max(maxLength, d.length);
        maxWidth = Math.max(maxWidth, d.width);
        totalHeight += d.height * item.quantity;
    }

    return { length: maxLength, width: maxWidth, height: totalHeight, weight: totalWeight };
}
async function buildPackageDetails(cartItems: ICartItem[]) {
    const productIds = cartItems.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } })
        .select('_id variants')
        .lean();

    const productMap = new Map(products.map(p => [p._id.toString(), p]));
    const itemDims = cartItems.map(item => {
        const product = productMap.get(item.productId.toString());
        if (!product) throw new Error(`Product not found for cart item ${item.productId}`);

        const variant = product.variants.find(v => v.sku === item.sku);
        if (!variant) throw new Error(`Variant with sku "${item.sku}" not found on product ${item.productId}`);

        return { ...variant.packed_dimensions, qty: item.qty };
    });
    const weight = itemDims.reduce((sum, d) => sum + d.weight * d.qty, 0);
    const length = Math.max(...itemDims.map(d => d.length));
    const breadth = Math.max(...itemDims.map(d => d.width)); // note: renamed here, at the boundary
    const height = itemDims.reduce((sum, d) => sum + d.height * d.qty, 0);
    // If Shiprocket needs one combined weight/box for the whole shipment
    // rather than per-item breakdown, also compute an aggregate:
    return { length, breadth, height, weight };
}


async function createShiprocketShipment(orderId: string) {
    const order = await Order.findById(orderId);
    if (!order || order.orderType !== 'product') {
        const msg = `Order not found, skipping`;
        console.error(msg);
        throw new Error(msg);
    }

    // Idempotency guard — don't re-create if already shipped/synced
    if (order.shiprocket?.shipment_id && order.status === 'shipped') {
        const msg = `Order ${orderId} already shipped, skipping`;
        console.error(msg);
        throw new Error(msg);
    }

    // Validate required fields before calling Shiprocket at all
    const pkg = order.packageDetails;
    if (!pkg?.length || !pkg?.breadth || !pkg?.height || !pkg?.weight) {
        order.status = OrderStatus.Failed;
        order.shiprocket = {
            order_id: order.shiprocket?.order_id ?? null,
            shipment_id: order.shiprocket?.shipment_id ?? null,
            awb_code: order.shiprocket?.awb_code ?? null,
            courier_name: order.shiprocket?.courier_name ?? null,
            pickup_scheduled_date: order.shiprocket?.pickup_scheduled_date ?? null,
            label_url: order.shiprocket?.label_url ?? null,
            status: 'sync_failed_missing_package_details'
        };
        await order.save();
        const msg = `Order ${orderId} missing package dimensions/weight, cannot ship.`;
        console.error(msg);
        throw new Error(msg);

    }

    let token: string;
    try {
        token = await getShiprocketToken();
    } catch (err: any) {
        order.status = 'failed';
        order.shiprocket = {
            order_id: order.shiprocket?.order_id ?? null,
            shipment_id: order.shiprocket?.shipment_id ?? null,
            awb_code: order.shiprocket?.awb_code ?? null,
            courier_name: order.shiprocket?.courier_name ?? null,
            pickup_scheduled_date: order.shiprocket?.pickup_scheduled_date ?? null,
            label_url: order.shiprocket?.label_url ?? null,
            status: 'sync_failed_missing_package_details'
        };
        console.error('Shiprocket auth failed:', err.response?.data || err.message);
        await order.save();
        throw err;
    }

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    try {

        const mappedOrder = order.items.map(item => ({
            name: item.name,
            sku: item.sku,
            units: item.quantity,
            selling_price: item.priceAtPurchase
        }));
        console.log('mappedOrder', mappedOrder)
        // Step 1: create order on Shiprocket
        const { data } = await axios.post(
            'https://apiv2.shiprocket.in/v1/external/orders/create/adhoc',
            {
                order_id: order._id.toString(),
                order_date: new Date(order.createdAt).toISOString().slice(0, 16).replace('T', ' '),
                pickup_location: 'Home',
                billing_customer_name: order.userSnapshot.firstName,
                billing_last_name: order.userSnapshot.lastName || '',
                billing_address: order.shippingAddress?.address,
                billing_address_2: order.shippingAddress?.landmark || '',
                billing_city: order.shippingAddress?.city,
                billing_pincode: order.shippingAddress?.pincode,
                billing_state: order.shippingAddress?.state,
                billing_country: order.shippingAddress?.country || 'India',
                billing_email: order.userSnapshot.email,
                billing_phone: order.userSnapshot.phone,
                shipping_is_billing: true,
                order_items: mappedOrder,
                payment_method: order.paymentMethod,
                sub_total: order.totalAmount,
                shipping_charges: 0,
                giftwrap_charges: 0,
                transaction_charges: 0,
                total_discount: 0,
                length: pkg.length,
                breadth: pkg.breadth,
                height: pkg.height,
                weight: pkg.weight
            },
            authHeader
        );

        if (!data.shipment_id) {
            console.error(`Shiprocket did not return a shipment_id: ${JSON.stringify(data)}`);
            throw new Error(`Shiprocket did not return a shipment_id: ${JSON.stringify(data)}`);
        }

        // Step 2: persist Shiprocket's returned IDs immediately
        order.shiprocket = {
            order_id: data.order_id,
            shipment_id: data.shipment_id,
            awb_code: null,
            courier_name: null,
            pickup_scheduled_date: null,
            label_url: null,
            status: data.status || 'created'
        };
        await order.save();

        // Step 3: assign AWB
        const awbRes = await axios.post(
            'https://apiv2.shiprocket.in/v1/external/courier/assign/awb',
            { shipment_id: data.shipment_id },
            authHeader
        );

        const awbData = awbRes.data?.response?.data;
        if (!awbData?.awb_code) {
            console.error(`AWB assignment failed: ${JSON.stringify(awbRes.data)}`)
            throw new Error(`AWB assignment failed: ${JSON.stringify(awbRes.data)}`);
        }

        order.shiprocket.awb_code = awbData.awb_code;
        order.shiprocket.courier_name = awbData.courier_name;
        order.shiprocket.status = 'awb_assigned';
        await order.save();

        // Step 4: schedule pickup
        try {
            const pickupRes = await axios.post(
                'https://apiv2.shiprocket.in/v1/external/courier/generate/pickup',
                { shipment_id: [data.shipment_id] },
                authHeader
            );
            order.shiprocket.pickup_scheduled_date =
                pickupRes.data?.response?.pickup_scheduled_date || null;
        } catch (pickupErr: any) {
            // Non-fatal — order is shippable even if pickup scheduling fails; can retry manually
            console.error('Pickup scheduling failed:', pickupErr.response?.data || pickupErr.message);
            order.shiprocket.status = 'pickup_pending_manual';
        }

        order.status = 'shipped';
        await order.save();

    } catch (err: any) {
        order.status = 'failed';
        if (order.shiprocket) {
            order.shiprocket = order.shiprocket || {};
            order.shiprocket.status = 'sync_failed';
        }
        await order.save();
        console.error('Shiprocket sync failed:', err.response?.data || err.message);
        throw err;
    }
}