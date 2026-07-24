// controllers/subscriptionPlanController.ts
import { RequestHandler } from "express";
import SubscriptionPlan from "../models/subscriptionPlan";

export class SubscriptionPlanController {
  static list: RequestHandler = async (req, res) => {
    const plans = await SubscriptionPlan.find({ isActive: true }).lean();
    return res.status(200).json(plans);
  };

  static getBySlug: RequestHandler = async (req, res) => {
    const plan = await SubscriptionPlan.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    return res.status(200).json(plan);
  };

  // --- Admin-only below ---
  static create: RequestHandler = async (req, res) => {
    try {
      const existing = await SubscriptionPlan.findOne({ slug: req.body.slug });
      if (existing) return res.status(400).json({ message: "Slug already exists" });
      const plan = await new SubscriptionPlan(req.body).save();
      return res.status(201).json(plan);
    } catch (err) {
      return res.status(500).json({ message: "Failed to create plan", err });
    }
  };

  static update: RequestHandler = async (req, res) => {
    try {
      const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!plan) return res.status(404).json({ message: "Plan not found" });
      return res.status(200).json(plan);
    } catch (err) {
      return res.status(500).json({ message: "Failed to update plan", err });
    }
  };

  static remove: RequestHandler = async (req, res) => {
    // Soft delete — never hard-delete a plan that existing subscriptions reference
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    return res.status(200).json({ message: "Plan deactivated", plan });
  };
}