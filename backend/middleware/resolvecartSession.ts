import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Runs before every /api/cart/* route. If the user is logged in, resolveCart()
// in cart.controller.ts will use req.user._id instead and this cookie is irrelevant.
// If they're a guest, this guarantees their cart is findable on their NEXT request too -
// without it, every request would look like a brand new anonymous visitor with no cart.
export function resolveCartSession(req: Request, res: Response, next: NextFunction) {
    if ((req as any).user) return next(); // logged-in users don't need this cookie at all

    if (!req.cookies?.cartSession) {
        const sessionId = randomUUID();
        res.cookie('cartSession', sessionId, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });
        req.cookies = { ...req.cookies, cartSession: sessionId };
    }
    next();
}