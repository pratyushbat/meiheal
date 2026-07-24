import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { sendError } from "../utils/sendError";
import userModel from "../models/userModel";

export const authGuard = async (
  req: Request | any,
  res: Response,
  next: NextFunction
) => {
  try {
    let jwtkey = process.env.JWT_KEY || "";
    if (req.cookies?.jwtAutToken) {
      const isTokenIsVerify: any = jwt.verify(
        req.cookies?.jwtAutToken,
        jwtkey
      );
      if (isTokenIsVerify) {
        const userId = isTokenIsVerify.userId;
        const requestedUser = await userModel.findById(userId).select("-password");

        if (!requestedUser) {
          return sendError(res, 401, "Session expired. Please login.", null);
        }
        req.user = requestedUser;
        console.log('setting guard ------ req.user---', req.user)
        return next();
      } else {
        return sendError(res, 401, "token not verified", null);
      }
    }
    else {
      return sendError(res, 401, "Session expired. Please login.", null);
    }
  }

  catch (error: any) {
    return sendError(res, 401, "Session expired. Please login again.", null);
  }
};
