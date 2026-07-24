import { OauthController } from './oaauthController';
import User from "../models/userModel";
const bcrypt = require('bcryptjs');
import { CookieOptions } from "express"; // Import the type
import { Request, Response } from "express";
import { decodeIdToken, generateCodeVerifier, generateState } from "arctic";
import { google } from "../lib/oauth/google";
import crypto from 'crypto';
import { OAUTH_EXCHNGE_EXPIRY } from "../config/constants";
import OAuthAccount from "../models/oauthModel";
import userModel from '../models/userModel';
import { createNewUser } from './paymentController';
import { createLoginToken } from '../utils/createToken';
import { mergeGuestCartIntoUser } from './cartController';
export class GoogleController {

    static async getGoogleLoginPage(req: any, res: Response) {
        if (req.user)
            return res.redirect("/");
        const state = generateState();
        const codeVerifier = generateCodeVerifier();
        // const scopes = ["user:email", "repo"];
        const url = google.createAuthorizationURL(state, codeVerifier, [
            "openid",
            "profile",
            "email",
        ]);

        const cookieConfig: CookieOptions = {
            httpOnly: true,
            secure: true,
            maxAge: OAUTH_EXCHNGE_EXPIRY,
            sameSite: "lax",
        };

        res.cookie("google_oauth_state", state, cookieConfig);
        res.cookie("google_oauth_verifier", codeVerifier, cookieConfig);
        res.redirect(url.toString());

    }
    static async getGoogleCallback(req: any, res: Response) {
        const { code, state } = req.query;
        const { google_oauth_state: storedState, google_oauth_verifier: codeVerifier } = req.cookies;
        if (
            !code ||
            !state ||
            !storedState ||
            !codeVerifier ||
            state != storedState

        ) {
            req.flash("errors", "Coudn't login with google because invalid login attempt.Please try again!");
            return res.redirect("/login");

        }

        let tokens: any;
        try {
            tokens = await google.validateAuthorizationCode(code, codeVerifier);
        } catch {
            req.flash("errors", "Coudn't login with google because invalid login attempt.Please try again!");
            return res.redirect("/login");
        }

        const claims: any = decodeIdToken(tokens.idToken());
        const { sub: googleUserId, name, email } = claims;

        // User already exist with google oauth linked

        // User already exist with same email but google oauth isnt linked

        // User doesnt exist

        // Step 1: Look up the user by email
        let user: any = await userModel.findOne({ email }).lean();
        // User doesnt exist

        if (!user) {
            const setupToken = crypto.randomBytes(20).toString('hex');
            const hashedSetupToken = crypto.createHash('sha256').update(setupToken).digest('hex');
            const setupTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
            user = await createNewUser(setupToken, hashedSetupToken, setupTokenExpire, name, email);
            user.isGuest = false;
            user.verified = true;
            await user.save();
            // 2. Create the OAuth record and link it to the new user
            await OauthController.createGoogleOauthAccount({
                userId: user._id,
                providerAccountId: googleUserId,
            });

        }
        // If we reach this line, it means the user DOES exist.
        // Now we check if they have a Google account linked.
        const existingOauth: any = await OAuthAccount.findOne({
            userId: user._id,
            provider: 'google'
        }).lean();
        if (!existingOauth) {
            // We trust Google's email verification, so we simply link the account
            const newOauthAccount = await OauthController.createGoogleOauthAccount({
                userId: user._id,
                providerAccountId: googleUserId,
            });

            const token = await createLoginToken({ userId: user._id, email: user.email });
            const expiration = new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000); // 2 hours in milliseconds
            res.cookie("jwtAutToken", token, {
                expires: expiration,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                sameSite: "lax",
                // domain: "meiheal.com"
            });
            // Everything is correct. Proceed with normal login.
            await mergeGuestCartIntoUser(req.cookies?.cartSession, user._id);
            return res.redirect("/dashboard");
        }

        if (existingOauth.providerAccountId !== googleUserId) {
            throw new Error("Security alert: OAuth ID mismatch for this email.");
        }

        const token = await createLoginToken({ userId: user._id, email: user.email });

        const expiration = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 2 hours in milliseconds
        res.cookie("jwtAutToken", token, {
            expires: expiration,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: "lax",
            // domain: "meiheal.com"
        });
        // Everything is correct. Proceed with normal login.
        await mergeGuestCartIntoUser(req.cookies?.cartSession, user._id);
        return res.redirect("/dashboard");

    }

    static logoutUser(req: Request, res: Response) {

        const { token, newPassword } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        User.findOne({
            setupToken: token,
            setupTokenExpire: { $gt: Date.now() }
        }).exec().then(async (user) => {
            if (user) {
                user.password = await bcrypt.hash(newPassword, 10);
                user.setupToken = undefined;
                user.setupTokenExpire = undefined;
                user.isGuest = false;
                await user.save();
                return res.status(200).json({ message: "Password set successfully!" });
            } else
                return res.status(400).json({ message: "Token is invalid or has expired." });

        }).catch((err) => {
            return res.status(500).send(err);
        })
    }

}
