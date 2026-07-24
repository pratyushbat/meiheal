// controllers/subscriptionController.ts
import { RequestHandler } from "express";

import Subscription from "../models/subscriptionModel";
import { createCheckoutOrder } from "./orderControllerN";
import { OrderType } from "../models/orderModelN";

export class SubscriptionController {
  static subscribe: RequestHandler = async (req, res) => {
    try {
      const { planId, guestDetails } = req.body;
      const user = (req as any).user;
      const { order, razorpayOrder } = await createCheckoutOrder({ orderType: OrderType.Subscription, user, sessionId: null, paymentMethod: "Prepaid", guestDetails, planId });
      return res.status(201).json({ order, razorpayOrder });
    } catch (err: any) {
      return res.status(400).json({ message: err.message || "Failed to start subscription" });
    }
  };

  static mySubscriptions: RequestHandler = async (req, res) => {
    const userId = (req as any).user._id;
    const subs = await Subscription.findOne({ userId }).sort({ createdAt: -1 }).lean();
    if (!subs) return res.status(404).json({ message: 'No active subscription' })
    const progress = getSubscriptionProgress({ currentPeriodStart: subs.currentPeriodStart, currentPeriodEnd: subs.currentPeriodEnd });
    return res.status(200).json({ ...subs, ...progress });
    // return res.status(200).json(subs);
  };

  static cancel: RequestHandler = async (req, res) => {
    const userId = (req as any).user._id;
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId },
      { cancelAtPeriodEnd: true }, // let it run out the paid period, don't cut off immediately
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: "Subscription not found" });
    return res.status(200).json(sub);
  };

  static pause: RequestHandler = async (req, res) => {
    const userId = (req as any).user._id;
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId, status: 'active' },
      { status: 'paused' },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: "Active subscription not found" });
    return res.status(200).json(sub);
  };

  static resume: RequestHandler = async (req, res) => {
    const userId = (req as any).user._id;
    const sub = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId, status: 'paused' },
      { status: 'active' },
      { new: true }
    );
    if (!sub) return res.status(404).json({ message: "Paused subscription not found" });
    return res.status(200).json(sub);
  };
}

function getSubscriptionProgress(sub: {
  currentPeriodStart: Date | string;
  currentPeriodEnd: Date | string;
}) {
  const start = new Date(sub.currentPeriodStart).getTime();
  const end = new Date(sub.currentPeriodEnd).getTime();
  const now = Date.now();

  const totalDurationMs = end - start;
  const elapsedMs = Math.max(0, now - start);
  const remainingMs = Math.max(0, end - now);

  const daysLeft = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  const totalDays = Math.ceil(totalDurationMs / (1000 * 60 * 60 * 24));
  const daysElapsed = totalDays - daysLeft;

  const progressPercent = Math.min(100, Math.max(0,
    Math.round((elapsedMs / totalDurationMs) * 100)
  ));

  return { daysLeft, totalDays, daysElapsed, progressPercent };
}