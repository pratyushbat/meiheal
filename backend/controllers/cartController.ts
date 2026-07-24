

import { Request, Response } from 'express';
import { Cart } from '../models/cartModel';
import Product, { IProduct } from '../models/productsModel';
import { randomUUID } from 'crypto';
// import { Product } from '../models/productsModel';
// import { Cart } from './cart.model';
// import { Product } from './product.model'; // adjust to your actual product model

/* async function resolveCart(req: Request) {
    const userId = (req as any).user?._id;
    const sessionId = req.cookies?.cartSession;

    const filter = userId ? { userId } : { sessionId };
    console.log('filter', filter)
    let cart = await Cart.findOne(filter);
    if (!cart) {
        cart = await Cart.create(userId ? { userId, items: [] } : { sessionId, items: [] });
    }
    return cart;
} */
async function resolveCart(req: Request, res: Response) {
    const userId = (req as any).user?._id;

    if (userId) {
        let cart = await Cart.findOne({ userId });
        if (!cart) cart = await Cart.create({ userId, items: [] });
        return cart;
    }

    // Never let sessionId reach the query as undefined — that collapses
    // the filter to {} and matches a random existing cart.
    let sessionId = req.cookies?.cartSession;
    if (!sessionId) {
        sessionId = randomUUID();
        res.cookie('cartSession', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env['NODE_ENV'] === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });
    }

    try {
        return await Cart.findOneAndUpdate(
            { sessionId },
            { $setOnInsert: { sessionId, items: [] } },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
    } catch (err: any) {
        if (err?.code === 11000) {
            const cart = await Cart.findOne({ sessionId });
            if (cart) return cart;
        }
        throw err;
    }
}

// POST /api/cart/add
// Body matches CartItem minus _id (server assigns that)
export async function addToCart(req: Request, res: Response) {
    const cart = await resolveCart(req, res);
    const {
        productId, type, sku, slug, name, brand, thumbnail,
        price, compareAtPrice, currency, qty = 1, rating, reviewCount,
        selectedColor, selectedSize, maxStock, billingInterval,
    } = req.body;

    // Never trust the client-sent price - re-fetch the live product and use ITS price.
    // The client-sent `price` is only useful for detecting drift (e.g. showing
    // "price changed since you added this" later), never for what gets stored/charged.
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product no longer available' });
    const verifiedPrice = product.price; // adjust field name to your actual Product schema

    // Subscriptions: always qty 1, and replace any existing instance rather than duplicating
    if (type === 'subscription') {
        cart.items = cart.items.filter(
            i => !(i.type === 'subscription' && String(i.productId) === productId)
        ) as any;
        cart.items.push({
            productId, type, slug, name, brand, thumbnail,
            price: verifiedPrice, compareAtPrice, currency, qty: 1,
            rating, reviewCount, billingInterval,
        } as any);
    } else {

        const variant = product.variants.find(v => v.sku === sku);
        if (!variant) {
            return res.status(404).json({ message: `Variant ${sku} not found on this product` });
        }
        if (variant.stock < qty) {
            return res.status(400).json({ message: `Only ${variant.stock} units available for ${sku}` });
        }
        const verifiedPrice = variant.price;
        const verifiedCompareAtPrice = variant.compareAtPrice;
        const verifiedMaxStock = variant.stock;


        // Products: match on productId + selectedColor + selectedSize (same product,
        // different variant = different line item, not a qty bump on the wrong line)
        const existing = cart.items.find(
            i => String(i.productId) === productId &&
                i.type === 'product' &&
                i.sku === sku
        );

        if (existing) {
            const newQty = existing.qty + qty;
            existing.qty = Math.min(newQty, verifiedMaxStock);

        } else {
            cart.items.push({
                productId, type, sku, slug, name, brand, thumbnail,
                price: verifiedPrice,
                compareAtPrice: verifiedCompareAtPrice,
                currency, qty,
                rating, reviewCount,
                selectedColor: variant.color ?? selectedColor,
                selectedSize: variant.size ?? selectedSize,
                maxStock,
            } as any);
        }
    }

    await cart.save();
    return res.json(cart);
}

// GET /api/cart
export async function getCart(req: Request, res: Response) {
    res.set('Cache-Control', 'no-store');
    const cart = await resolveCart(req, res);
    // console.log('sending cart -----', cart)
    return res.json(cart);
}

// PATCH /api/cart/item/:itemId
// Body: { qty }
export async function updateCartItem(req: Request, res: Response) {
    const cart = await resolveCart(req, res);
    const item = cart.items.id((req as any).params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    const requestedQty = req.body.qty;
    item.qty = item.maxStock ? Math.min(requestedQty, item.maxStock) : requestedQty;

    await cart.save();
    return res.json(cart);
}

// DELETE /api/cart/item/:itemId
export async function removeCartItem(req: Request, res: Response) {
    const cart = await resolveCart(req, res);
    const item = cart.items.id((req as any).params.itemId);
    if (!item) return res.status(404).json({ message: 'Item not found in cart' });

    cart.items.pull(req.params.itemId);
    await cart.save();
    return res.json(cart);
}

// cart.controller.ts — add this alongside resolveCart

export async function mergeGuestCartIntoUser(sessionId: string | undefined, userId: string) {
    if (!sessionId) return;

    const guestCart = await Cart.findOne({ sessionId });
    if (!guestCart || guestCart.items.length === 0) return;

    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
        // no existing user cart — just hand this cart over to the user directly
        guestCart.userId = userId as any;
        guestCart.sessionId = undefined as any;
        await guestCart.save();
        return;
    }

    // both exist — merge items using the same match/qty-cap logic as addToCart
    for (const guestItem of guestCart.items) {
        const existing = userCart.items.find(
            i => String(i.productId) === String(guestItem.productId) &&
                i.type === guestItem.type &&
                i.selectedColor === guestItem.selectedColor &&
                i.selectedSize === guestItem.selectedSize
        );

        if (existing) {
            const newQty = existing.qty + guestItem.qty;
            existing.qty = guestItem.maxStock ? Math.min(newQty, guestItem.maxStock) : newQty;
        } else {
            userCart.items.push(guestItem.toObject ? guestItem.toObject() : guestItem);
        }
    }

    await userCart.save();
    await Cart.deleteOne({ _id: guestCart._id }); // guest cart no longer needed
}