import {
  Request,
  Response,
  RequestHandler,
} from "express";
import { sendError } from "../utils/sendError";
import mongoose from "mongoose";
import dietPlanModel from "../models/dietPlanModel";
const slugify = require('slugify');

export const allDietPlansList: RequestHandler = async (req: Request, res: Response) => {
  try {
    const dietPlans = await dietPlanModel.find().select('-__v').sort({ price: 1 }).lean();;
    res.json(dietPlans);

  } catch (error: any) {
    sendError(res, 400, "Failed To Login 🙄", error?.message);
  }
};

export const dietPlanById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid dietPlan id'
      });
    }
    const dietPlan = await dietPlanModel.findById(id);
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'dietPlan not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: dietPlan
    });

  } catch (error: any) {
    return sendError(res, 400, "Failed To Login 🙄", error?.message);
  }
};


export const createDietPlan: RequestHandler = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { name, description, price } = req.body;


    const newdietPlan = await dietPlanModel.create({
      name,
      slug: slugify(name, { lower: true }),
      description,
      price: Number(price),
    });
    return res.status(200).json({
      success: true,
      product: newdietPlan,
    });

  }
  catch (error: any) {
    return sendError(res, 400, "Failed to create dietPlans otp", error);
  }
};



