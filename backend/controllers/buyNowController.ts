import { Request, Response } from 'express';
import { BuyNowSession } from '../models/buyNowModel';
import Product, { IProduct } from '../models/productsModel';

// POST /api/checkout/buy-now
// Body: { productId, name, thumbnail, price, qty, type, billingInterval? }
// Returns: { sessionId } - frontend redirects to /checkout?buyNow=<sessionId>
export async function createBuyNowSession(req: Request, res: Response) {

    try {
        const item = Array.isArray(req.body) ? req.body[0] : req.body;
        if (!item?.productId) {
            return res.status(400).json({ message: 'Invalid item payload' });
        }
        const product = await Product.findById(item.productId);
        if (!product) return res.status(404).json({ message: 'Product no longer available' });

        const session = await BuyNowSession.create({
            item: { ...item, priceAtPurchase: product.price }
        });
        return res.json({ sessionId: session._id });
    } catch (err) {
        console.error('createBuyNowSession failed:', err); // 👈 this will likely reveal the real cause
        return res.status(500).json({ message: 'Could not start checkout' });
    }
}

// GET /api/checkout/buy-now/:sessionId
export async function getBuyNowSession(req: Request, res: Response) {
    const session = await BuyNowSession.findById(req.params.sessionId);
    // Either never existed, or Mongo's TTL index already auto-deleted it after 30 min.
    if (!session) {
        return res.status(404).json({ message: 'This checkout link has expired.' });
    }
    return res.json({ items: [session.item] });
}