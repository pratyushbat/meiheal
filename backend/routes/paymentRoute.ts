import { Router } from "express";
import { handleRazorpayWebhook } from "../controllers/paymentController";

const route: Router = Router();


// route.post("/createOrder", createOrder);
// route.post("/verifyPayment", verifyPayment);
route.post("/webhook", handleRazorpayWebhook);
export default route;
