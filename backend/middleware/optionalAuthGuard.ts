
import { NextFunction, Request, Response } from "express";
import userModel from "../models/userModel";
import jwt from "jsonwebtoken";
// optionalAuthGuard.ts
export const optionalAuthGuard = async (
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
                if (requestedUser) {
                    req.user = requestedUser;
                }
            }
        }
        return next(); // always reached
    } catch (error: any) {
        return next(); // invalid/expired token — proceed as guest
    }
};