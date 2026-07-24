
// routes/subscriptionRoute.ts
import { Router } from "express";
import { SubscriptionController } from "../controllers/subscriptionController";
// import { authGuard } from "../middleware/authMiddleware";
import { OrderControllerN } from "../controllers/orderControllerN";
import { optionalAuthGuard } from "../middleware/optionalAuthGuard";
import { authGuard } from "../middleware/authGuard";


const router = Router();
router.post("/webhook", OrderControllerN.shiprocketWebhook);
// routes/orderRoute.ts (extend your existing one)
router.post("/checkout-product", optionalAuthGuard, OrderControllerN.checkoutProduct);
router.post("/checkout-sub", optionalAuthGuard, OrderControllerN.checkoutSubscribe);
router.post("/verifyPayment", optionalAuthGuard, OrderControllerN.verifyPayment);
router.post("/createShipmentTemp/:orderId", OrderControllerN.createShipmentTemp);
router.get("/pincode/:pincode", OrderControllerN.checkPincode);
// all orders
router.get("/mine", authGuard, OrderControllerN.myOrders);
// req.params.id
router.get("/orderByUserId/:id", authGuard, OrderControllerN.getByUserId);
// req.params.id
router.get("/orderByUserIdPdf/:id", authGuard, OrderControllerN.getByUserIdPdf);
router.get("/orderById/:id", authGuard, OrderControllerN.orderById);

export default router;