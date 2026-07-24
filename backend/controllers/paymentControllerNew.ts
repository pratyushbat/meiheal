/* import {
  Request,
  Response,
  RequestHandler,
} from "express";
import { sendError } from "../utils/sendError";
import { Resend } from 'resend';
import crypto from 'crypto';
import dietPlanModel from "../models/dietPlanModel";
import { createRazorpayInstance } from "../config/razorpay.config";
import userModel, { IUser } from "../models/userModel";
import orderModel from "../models/orderModelN";
import { EmailTokenTempVerificationHtml } from '../nodemailer';
var randomstring = require("randomstring");
const razorpayInstance = createRazorpayInstance();




export const createOrder: RequestHandler = async (
  req: Request | any,
  res: Response
) => {
  try {
    const product: any = await dietPlanModel.findById(req.body.productId);
    if (!product) {
      return res.status(404).json({ message: "Product Not found" });
    }
    const { name, gender, age, email, phone, productId, productName, amount } = req.body;
    let user: any = await userModel.findOne({ email: email });

    if (!user) {
      try {
        user = await createNewUser(undefined, undefined, undefined, name, email, phone);
      } catch (createErr: any) {
        if (createErr.code === 11000) {

          return res.status(409).json({
            message: "We couldn't create your account with these details. Please double check your information or contact support.",
            createErr
          });
        }
        throw createErr;
      }

    }

    const options = {
      amount: product.price * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    }
    const order = await razorpayInstance.orders.create(options);
    let newOrder;
    let nwOrderSv;


    try {
      newOrder = new orderModel({
        userId: user._id,
        productId: product.id,
        userSnapshot: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone
        },
        productSnapshot: {
          name: product.name,
          priceAtPurchase: order.amount
        },
        totalAmount: order.amount,
        currency: "INR",
        status: "pending",

        razorpay_order_id: order.id,
        razorpay_payment_id: null,
        razorpay_signature: null
      });
      nwOrderSv = await newOrder.save();
    } catch (dbErr) {
      // Razorpay order exists but local record failed — log loudly, this needs reconciliation
      console.error("CRITICAL: Razorpay order created but local save failed", order.id, dbErr);
      return sendError(res, 500, "Order creation failed, please contact support", dbErr);
    }

    return res.status(200).json({ ...order, localOrderId: nwOrderSv._id });
  }
  catch (error: any) {
    return sendError(res, 400, "Failed to create Order", error);
  }
};



export const verifyPayment: RequestHandler = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    if (!order_id || !payment_id || !signature) {
      return res.status(400).json({ message: "Missing Razorpay payment details" });
    }


    const secret: any = process.env.RAZORPAY_KEY_SECRET;
    //create hmac object 
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(order_id + "|" + payment_id);
    const generatedSignature = hmac.digest("hex");
    if (generatedSignature != signature) {
      return res.status(400).json({ success: false, message: "Payment verification failed" });
    }

    // 2. Fetch the order, confirm it's not already processed (idempotency)
    const order = await orderModel.findOne({ razorpay_order_id: order_id });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status === "paid") {
      // already processed — don't regenerate token, just return existing flow state
      return res.status(200).json({ success: true, message: "Already verified" });
    }

    let user: any = await userModel.findById(order.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 3. Mark order as paid
    order.status = "paid";
    order.razorpay_payment_id = payment_id;
    order.razorpay_signature = signature;
    let updatedOrder: any = await order.save();
    const { rawToken, hashedToken, expiresAt } = generateSetupToken();
    user.setupToken = hashedToken;       // store hashed version, never raw
    user.setupTokenExpire = expiresAt;
    await user.save();
    sendEmail(user, rawToken);
    return res.status(200).json({ success: true, message: "Payment successful and order updated.", orderId: updatedOrder._id, token: rawToken });

  }
  catch (error) {
    return res.status(500).json({ success: false, message: "An internal server error occurred while verifying the payment." });
  }
}


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
    if (order.status === "paid") {
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



// --- helper: generate a secure, time-bound setup token ---
function generateSetupToken() {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h validity
  return { rawToken, hashedToken, expiresAt };
} */