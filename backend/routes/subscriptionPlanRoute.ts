// routes/subscriptionPlanRoute.ts
import { Router } from "express";
import { SubscriptionPlanController } from "../controllers/subscriptionPlanController";
// import { authGuard, adminGuard } from "../middleware/authMiddleware"; // your existing JWT guard

const router = Router();
router.get("/", SubscriptionPlanController.list);
router.get("/:slug", SubscriptionPlanController.getBySlug);
router.post("/", SubscriptionPlanController.create);
router.patch("/:id", SubscriptionPlanController.update);
router.delete("/:id", SubscriptionPlanController.remove);
/* router.post("/", authGuard, adminGuard, SubscriptionPlanController.create);
router.patch("/:id", authGuard, adminGuard, SubscriptionPlanController.update);
router.delete("/:id", authGuard, adminGuard, SubscriptionPlanController.remove); */
export default router;