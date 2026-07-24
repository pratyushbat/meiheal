import {
  Request,
  Response,
  RequestHandler,
} from "express";
import { sendError } from "../utils/sendError";
import mongoose from "mongoose";
import oauthModel from "../models/oauthModel";
import commentModel from "../models/commentModel";
import OAuthAccount from "../models/oauthModel";
import userModel from "../models/userModel";
const slugify = require('slugify');


export class OauthController {


  /*  static oauthaggrCommand: RequestHandler = async (req: Request, res: Response) => {
 
     try {
 
       const account = await OAuthAccount.findOne({
         provider: "google",
         providerAccountId: "googleUser.sub",
       });
       return res.status(200).json({
         success: true,
         result: account,
       });
     } catch (error: any) {
       return sendError(res, 400, "Failed To Login 🙄", error?.message);
     }
 
   } */
  /*  static async getUserWithOauthId({ email, provider }) {
     const [user] = await userModel.aggregate([
       // 1. Equivalent to .where(eq(usersTable.email, email))
       {
         $match: { email: email }
       },
 
       // 2. Equivalent to .leftJoin(oauthAccountsTable, ...)
       {
         $lookup: {
           from: 'oauthaccounts', // Note: Mongoose automatically lowercase-plurals collection names
           localField: '_id',
           foreignField: 'userId',
           pipeline: [
             // This applies the extra 'AND' condition on the join for the specific provider
             { $match: { provider: provider } }
           ],
           as: 'oauthData'
         }
       },
 
       // 3. Unwind array to flatten the data (preserveNullAndEmptyArrays is crucial for LEFT JOIN behavior)
       {
         $unwind: {
           path: '$oauthData',
           preserveNullAndEmptyArrays: true
         }
       },
 
       // 4. Equivalent to .select(...)
       {
         $project: {
           _id: 0,           // Suppress MongoDB's default _id
           id: '$_id',       // Map it to 'id' to match your Drizzle output
           name: 1,
           email: 1,
           isEmailValid: 1,
           // Optional chaining fallback in case the LEFT JOIN found nothing
           providerAccountId: { $ifNull: ['$oauthData.providerAccountId', null] },
           provider: { $ifNull: ['$oauthData.provider', null] }
         }
       }
     ]);
 
     return user; // Will be undefined if no user matches the email
   } */

  static async createGoogleOauthAccount({ userId, providerAccountId }) {
    try {
      // .create() is Mongoose's built-in method to insert a new document
      const newOauthAccount = await OAuthAccount.create({
        userId: userId,
        provider: 'google', // Hardcoded here since this is specifically for Google
        providerAccountId: providerAccountId,
      });

      return newOauthAccount;

    } catch (error) {
      // Catch duplicate key errors (e.g., if this Google account is already linked)
      if (error instanceof Error && (error as any).code === 11000) {
        throw new Error("This Google account is already linked to a user.");
      }

      console.error("Failed to create OAuth account:", error);
      throw new Error("Could not link Google account at this time.");
    }
  }
}















