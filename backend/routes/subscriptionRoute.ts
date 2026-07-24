// routes/subscriptionRoute.ts
import { Router } from "express";
import { SubscriptionController } from "../controllers/subscriptionController";
import { optionalAuthGuard } from "../middleware/optionalAuthGuard";
import { authGuard } from "../middleware/authGuard";
// import { authGuard } from "../middleware/authMiddleware";

const router = Router();
router.post("/subscribe", optionalAuthGuard, SubscriptionController.subscribe);
router.get("/mine", authGuard, SubscriptionController.mySubscriptions);
// router.patch("/:id/cancel", authGuard, SubscriptionController.cancel);
// router.patch("/:id/pause", authGuard, SubscriptionController.pause);
// router.patch("/:id/resume", authGuard, SubscriptionController.resume);
export default router;