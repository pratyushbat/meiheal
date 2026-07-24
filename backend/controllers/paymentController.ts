import {
  Request,
  Response,
  RequestHandler,
} from "express";
import { sendError } from "../utils/sendError";
import { Resend } from 'resend';
import crypto from 'crypto';
import { createRazorpayInstance } from "../config/razorpay.config";
import userModel from "../models/userModel";
import orderModel from "../models/orderModelN";
import { EmailTokenTempVerificationHtml } from '../nodemailer';

import { PaymentStatus } from "../enums/order.enum";
var randomstring = require("randomstring");
const razorpayInstance = createRazorpayInstance();



export const createNewUser = async (rawToken: string | undefined = undefined, hashedSetupToken: string | undefined = undefined, setupTokenExpire: Date | undefined = undefined, name: string, email: string, phone: string | undefined = undefined) => {
  let user = new userModel({
    firstName: name,
    lastName: '',
    email,
    phone,
    role: 'user',
    code: randomstring.generate(),
    isGuest: true, // (Your schema defaults this to true, but good to be explicit)
    userLocationData: {},
    addresses: []
  });

  // Generate the 24-hour setup token for their "Claim Account" email
  user.setupToken = hashedSetupToken;
  user.setupTokenExpire = setupTokenExpire;
  user.isGuest = true;
  let savedUser = await user.save();
  return savedUser;
}


export const retryPayment: RequestHandler = async (req: Request | any, res: Response) => {
  try {
    const { orderId } = req.body; // your local _id, not razorpay_order_id

    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.paymentStatus === PaymentStatus.Paid) {
      return res.status(400).json({ message: "Order already paid" });
    }

    // Create a fresh Razorpay order — old razorpay_order_id is dead/expired
    const options = {
      amount: order.totalAmount,
      currency: order.currency,
      receipt: `retry_${Date.now()}`,
    };

    const newRzpOrder = await razorpayInstance.orders.create(options);

    // Update the SAME local order with the new Razorpay reference
    order.razorpay_order_id = newRzpOrder.id;
    order.razorpay_payment_id = null;
    order.razorpay_signature = null;
    order.status = "pending"; // reset in case it was previously "failed"
    await order.save();

    return res.status(200).json(newRzpOrder);
  } catch (error: any) {
    return sendError(res, 400, "Failed to retry payment", error);
  }
};

const sendEmail = async (user, setupToken: string) => {
  let resendId: string = process.env.RESEND_ID || "";
  const resend = new Resend(resendId);
  const htmlInp = EmailTokenTempVerificationHtml(setupToken);
  resend.emails.send({
    from: 'notifications@meiheal.com',
    to: user.email,
    bcc: ['pratyush3030@gmail.com'],
    subject: 'Claim Account Dietician Vijeta',
    html: htmlInp
  })
    .then(result => console.log(result))
    .catch(err => console.error(err));
}

export const handleRazorpayWebhook: RequestHandler = async (req: Request, res: Response) => {
  try {
    console.log('inside -w0-----------webhook')
    const webhookSignature = req.headers["x-razorpay-signature"] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET as string;
    const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(req.body).digest("hex");

    if (expectedSignature !== webhookSignature) {
      return res.status(400).json({ message: "Invalid webhook signature" });
    }

    // NOW parse it, after signature is verified
    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    if (event === "payment.failed") {
      const rzpOrderId = payload.payload.payment.entity.order_id;
      let rrzpFailedOrderId = await orderModel.findOneAndUpdate(
        { razorpay_order_id: rzpOrderId },
        { status: "failed" }
      );
      console.log('rrzpFailedOrderId', rrzpFailedOrderId)
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).json({ message: "Webhook handling failed" });
  }
};

// --- helper: generate a secure, time-bound setup token ---
export function generateSetupToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h validity
  return { rawToken, hashedToken, expiresAt };
}