import { NextFunction, Request, Response } from "express";
import { sendError } from "../utils/sendError";

// adminGuard.ts
export const adminGuard = (
    req: Request | any,
    res: Response,
    next: NextFunction
) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Session expired. Please login.", null);
        }
        if (req.user.role !== "admin") {
            return sendError(res, 403, "Admin access required", null);
        }
        return next();
    } catch (error: any) {
        return sendError(res, 403, "Admin access required", null);
    }
};