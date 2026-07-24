import {
  Request,
  Response,
  RequestHandler,
} from "express";
import { sendError } from "../utils/sendError";
import mongoose from "mongoose";
import leadModel from "../models/leadModel";
const slugify = require('slugify');

export const allLeadsList: RequestHandler = async (req: Request, res: Response) => {
  try {
    const products = await leadModel.find().sort({ price: 1 });
    res.json(products);

  } catch (error: any) {
    sendError(res, 400, "Failed To Login 🙄", error?.message);
  }
};

export const leadcById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id'
      });
    }
    const product = await leadModel.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });

  } catch (error: any) {
    return sendError(res, 400, "Failed To Login 🙄", error?.message);
  }
};


export const createLead: RequestHandler = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { name, email, phone, subject, message, interest } = req.body;


    const newLead = await leadModel.create({
      name,
      email,
      phone,
      subject,
      message,
      interest
    });
    return res.status(200).json({
      success: true,
      product: newLead,
    });

  }
  catch (error: any) {
    return sendError(res, 400, "Failed to create Lead ", error);
  }
};



