import { Router } from 'express';
// import { addToCart, getCart, updateCartItem, removeCartItem } from './cart.controller';
import { createBuyNowSession, getBuyNowSession } from '../controllers/buyNowController';
import { resolveCartSession } from '../middleware/resolvecartSession';
import { addToCart, getCart, removeCartItem, updateCartItem } from '../controllers/cartController';
import { optionalAuthGuard } from '../middleware/optionalAuthGuard';

const cartRouter = Router();
cartRouter.use(resolveCartSession); // ensures guests get a sessionId cookie even without logging in

cartRouter.post('/add', optionalAuthGuard, addToCart);          // POST   /api/cart/add
cartRouter.get('/', optionalAuthGuard, getCart);                // GET    /api/cart
cartRouter.patch('/item/:itemId', optionalAuthGuard, updateCartItem); // PATCH  /api/cart/item/:itemId
cartRouter.delete('/item/:itemId', optionalAuthGuard, removeCartItem); // DELETE /api/cart/item/:itemId

const buyNowRouter = Router();
buyNowRouter.post('/buy-now', createBuyNowSession);       // POST /api/checkout/buy-now
buyNowRouter.get('/buy-now/:sessionId', getBuyNowSession); // GET  /api/checkout/buy-now/:sessionId

export { cartRouter, buyNowRouter };

// Mount in app.ts:
// app.use('/api/cart', cartRouter);
// app.use('/api/checkout', buyNowRouter);