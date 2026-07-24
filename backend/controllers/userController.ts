import User, { IUser } from "../models/userModel";
const bcrypt = require('bcryptjs');
import moment from 'moment';
import { Request, RequestHandler, Response } from "express";
import { EmailVerificationHtml, Nodemailer, PasswordResetHtml } from "../nodemailer";
import { Resend } from 'resend';
import { sendLoginCookie } from "../utils/sendCookies";
import { createLoginToken } from "../utils/createToken";
import { sendError } from "../utils/sendError";
import crypto from 'crypto';

import orderModel from "../models/orderModelN";
import { mergeGuestCartIntoUser } from "./cartController";
import { PaymentStatus } from "../enums/order.enum";
var randomstring = require("randomstring");

export class UserController {

    static verifyguesttokenfromemail(req: Request, res: Response) {

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

    static signUp(req: Request, res: Response) {
        if (!req.body.email && !req.body.password) {
            res.status(422).json({
                message: 'Please provide all details',
                status_code: 422
            })
        } else if (!req.body.email) {
            res.status(422).json({
                message: 'Please provide an email',
                status_code: 422
            })
        } else if (!req.body.password || !req.body.confirm_password) {
            res.status(422).json({
                message: 'Please provide a password and confirm password',
                status_code: 422
            })
        } else if (req.body.password !== req.body.confirm_password) {
            res.status(422).json({
                message: 'Password and confirm password does not match',
                status_code: 422
            })
        } else if (!req.body.firstName) {
            res.status(422).json({
                message: 'Please provide your  firstName',
                status_code: 422
            })
        } else if (!req.body.lastName) {
            res.status(422).json({
                message: 'Please provide your lastName',
                status_code: 422
            })
        } else {
            User.find({ email: req.body.email })
                .exec()
                .then(user => {
                    if (user.length >= 1) {
                        return res.status(409).json({
                            message: "Mail already exists",
                            status_code: 409
                        });
                    } else {
                        bcrypt.hash(req.body.password, 10, (err, hash) => {
                            if (err) {
                                return res.status(500).send(err)
                            } else {
                                const user = new User({
                                    firstName: req.body.firstName,
                                    lastName: req.body.lastName,
                                    email: req.body.email,
                                    phone: req.body.phone,
                                    password: hash,
                                    role: 'user',
                                    code: randomstring.generate(),
                                    isGuest: false,
                                    userLocationData: {},
                                    addresses: []
                                });
                                user
                                    .save()
                                    .then(async (data: any) => {
                                        const uri = (data as any).code;
                                        const html = EmailVerificationHtml(uri);
                                        let resendId: string = process.env.RESEND_ID || "";
                                        const resend = new Resend(resendId);
                                        resend.emails.send({
                                            from: 'notifications@meiheal.com',
                                            to: data.email,
                                            bcc: ['pratyush3030@gmail.com'],
                                            subject: 'Email Verfication',
                                            html: html
                                        });
                                        await mergeGuestCartIntoUser(req.cookies?.cartSession, data._id);
                                        return res.status(200).send(data)
                                    })
                                    .catch(err => {
                                        return res.status(500).send(err)
                                    });
                                return;
                            }
                        });
                        return;
                    }
                }).catch((err) => {
                    return res.status(500).send(err);
                });
        }

    };


    static verify(req: Request, res: Response) {
        const code = req.params.code;
        User.findOneAndUpdate({ code: code }, { verified: true }).exec().then((user) => {
            if (user) {
                res.redirect('https://www.meiheal.com.com')
            } else {
                res.send('email not verified. please try by clicking send email again');
            }
        }).catch((err) => {
            res.status(500).send(err);
        })
    }


    static getUserDetails(req: Request, res: Response) {
        const date = moment().format('LLLL');
        const user = (req as any).userData;
        const userId = (req as any).userData.userID;
        User.findOneAndUpdate({ _id: userId }, { last_active: date }, { new: true })
            .select('onboarding verified _id email password name code last_active experience_level job_category')
            .lean<IUser | null>()
            .then(data => {
                res.status(200).send(data);
            }).catch((err) => {
                res.status(500).send(err);
            })
    }

    static async login(req: Request, res: Response) {
        const email: string = req.body.email as string;
        const password: string = req.body.password;

        if (!email || !password) {
            return res.status(422).json({ message: 'please provide an email ', status_code: 422 })
        }

        try {
            const users = await User.find({ email })
                .select('_id firstName lastName email phone password profilePic role isGuest userLocationData addresses setupToken code verified')
                .lean<IUser[]>();

            if (users.length < 1) {
                return res.status(422).json({
                    message: "Email Does not exist",
                    status_code: 422
                });
            }
            const user = users[0] as any;
            if (!user.password) {
                return res.status(400).json({
                    message: "You have cretaed account using login.Please login with social account",
                    status_code: 400
                });
            }

            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(423).json({
                    message: "Email and password 423",
                    status_code: 423
                });
            }

            const token = await createLoginToken({
                userId: user._id,
                email: user.email
            });
            await mergeGuestCartIntoUser(req.cookies?.cartSession, user._id);
            return sendLoginCookie(res, token);
        } catch (err) {
            console.error(err);

            return res.status(500).send(err);
        }

    }

    static sendLoginCookie = (res: Response, token: string) => {
        const expiration = new Date(new Date().getTime() + 24 * 60 * 60 * 1000); // 2 hours in milliseconds
        res.cookie("jwtAutToken", token, {
            expires: expiration,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // HTTPS only in production
            sameSite: "lax",
            //    domain: "meiheal.com"
        });
        /*   res.cookie("jwtAutToken", token, {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 16 * 1000 // ✅ 1 hour login
          }); */

        res.status(200).json({
            success: true,
            message: `Logged In Successfully 😎 `,
        });
    };

    static getLoggedInUser: RequestHandler = (
        req: Request | any,
        res: Response
    ) => {
        try {
            res.set({
                'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            return res.status(200).json({
                success: true,
                userData: req.user,
            });
        } catch (error: any) {
            return sendError(res, 401, "Failed to get logged user", error.message);
        }
    };
    static logOutUser: RequestHandler = async (req: Request, res: Response) => {
        try {

            res.clearCookie('jwtAutToken', {
                httpOnly: true,
                secure: false,
                //    secure: true,
                sameSite: 'lax'
            });
            res.clearCookie('cartSession', { httpOnly: true, sameSite: 'lax' });
            return res.status(401).json({
                success: true,
                message: "User Logged OUT 🥰",
            });
        } catch (error: any) {
            return sendError(res, 400, "Failed To Logout", error?.message);
        }
    };
    static async sendResetPasswordMail(req: Request, res: Response) {
        const { email } = req.body;
        if (!email) {
            return res.status(422).json({
                message: 'Please send an email',
                status_code: 422
            });
        } else {
            try {
                const randomToken = crypto.randomBytes(20).toString('hex');
                const setupToken = crypto.createHash('sha256').update(randomToken).digest('hex');
                const setupTokenExpire = new Date(Date.now() + 24 * 60 * 60 * 1000);

                // const user = await User.findOne({ email: email });
                let user = await User.findOneAndUpdate(
                    { email },
                    { setupToken, setupTokenExpire },
                    { new: true }
                ).lean<IUser | null>();
                // console.log(user)
                if (!user)
                    return res.status(400).json({ message: 'Could not update or User not found', status_code: 400 });



                // let code = (user as any).code;
                // console.log('user.setuptoken', user.setupToken)
                // console.log('randomToken', randomToken)
                const html = PasswordResetHtml(randomToken);
                let resendId: string = process.env.RESEND_ID || "";
                const resend = new Resend(resendId);
                const { data, error } = await resend.emails.send({
                    from: 'admin@meiheal.com',
                    to: user.email,
                    bcc: ['pratyush3030@gmail.com'],
                    subject: 'Password Reset Email',
                    html: html
                });

                if (error) {
                    // console.error({ error });
                    return res.status(500).json({ message: "Failed to send email", error });
                }
                return res.status(200).json({
                    message: 'A password email has been sent to you',
                    code: randomToken,
                    status_code: 200
                });

            } catch (err) {
                return res.status(400).json({
                    message: 'User not found or database error',
                    status_code: 400
                });
            }


        }
    }


    static async setPasswordWithToken(req: Request, res: Response) {
        const { token, new_password, confirm_password } = req.body;
        if (!new_password || !confirm_password || !token) {
            return res.status(422).json({
                message: 'Please send a valid email , password and confirm password or token',
                status_code: 422
            });
        } else if (confirm_password !== new_password) {
            return res.status(422).json({
                message: "new password and confirm password does'nt match",
                status_code: 422
            });
        }
        else if (new_password.length < 8) {
            return res.status(422).json({
                message: 'Password must be at least 8 characters',
                status_code: 422
            });
        }
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
        const user = await User.findOne({
            setupToken: hashedToken,
            setupTokenExpire: { $gt: new Date() } // $gt means "greater than" (not yet expired)
        });

        if (!user)
            return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = await bcrypt.hash(new_password, 10);
        user.setupToken = undefined;
        user.setupTokenExpire = undefined;
        user.isGuest = false;
        await user.save();
        return res.status(200).json({ message: 'Password reset successful' });
    }

    static async setPasswordWithTokenPostPayment(req: Request, res: Response) {
        let new_password = req.body.new_password;
        const confirm_password = req.body.confirm_password;
        const token = req.body.setupToken;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        if (!new_password || !confirm_password || !token) {
            return res.status(422).json({
                message: 'Please send a valid email , password and confirm password or token',
                status_code: 422
            });
        } else if (confirm_password !== new_password) {
            return res.status(422).json({
                message: "new password and confirm password does'nt match",
                status_code: 422
            });
        }
        else if (new_password.length < 8) {
            return res.status(422).json({
                message: 'Password must be at least 8 characters',
                status_code: 422
            });
        }
        else {
            const user = await User.findOne({
                setupToken: hashedToken,
                setupTokenExpire: { $gt: Date.now() }
            }).lean<IUser | null>();
            if (!user)
                return res.status(400).json({ message: 'Invalid or expired user token' });

            // 6. Verify the setup token (stored on user after payment)
            if (!user.setupToken || user.setupToken !== hashedToken || (!user.setupTokenExpire || user.setupTokenExpire < new Date())) {
                return res.status(401).json({
                    message: 'Setup link has expired. Check your email for a new one.',
                    status_code: 401
                });
            }


            // console.log('user recived for password reset post payment ', user)
            const hasPaidBefore = await orderModel.exists({
                userId: user._id,
                paymentStatus: PaymentStatus.Paid
            });

            // console.log('hasPaidBefore', hasPaidBefore);
            if (!hasPaidBefore) {
                return res.status(400).send({
                    message: "User has not completed payment"
                });
            }

            const hash = await bcrypt.hash(new_password, 10);
            new_password = hash;
            const userUpdated = await User.updateOne({ _id: user._id }, { $set: { password: hash, setupToken: undefined, setupTokenExpire: undefined, isGuest: false } });
            if (userUpdated?.modifiedCount === 0)
                return res.status(400).send({ message: "Password was not updated" });

            console.log('userUpdated final-------- now login in new user', userUpdated)
            let token;
            try {
                token = await createLoginToken({ userId: user._id, email: user.email });
            } catch (err) {
                return res.status(200).json({ message: 'Password set. Please log in.', autoLoginFailed: true });
            }
            const expiration = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
            res.cookie("jwtAutToken", token, {
                expires: expiration,
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production', // HTTPS only in production
                sameSite: "lax",
                // domain: ".meiheal.com"
            });
            return res.status(200).send({ userUpdated, messaage: 'logged in successs user password created' });
        }
    }

    static verifyUserMail(req: Request, res: Response) {
        const { email } = req.body;
        if (!email) {
            res.status(422).json({
                message: 'Please send an email',
                status_code: 422
            });
        } else {
            User.findOne({ email: email }).then((data) => {
                if (data) {
                    let code = (data as any).code;
                    const html = EmailVerificationHtml(code)

                    let resendId: string = process.env.RESEND_ID || "";
                    const resend = new Resend(resendId);
                    resend.emails.send({
                        from: 'notifications@meiheal.com',
                        to: data.email,
                        bcc: ['pratyush3030@gmail.com'],
                        subject: 'Verify User Email',
                        html: html
                    });
                    return res.status(200).json({
                        message: 'A password email has been sent to you',
                        code: code,
                        status_code: 200
                    });
                }
                else
                    return res.status(400).json({
                        message: 'User not found',

                        status_code: 400
                    });


            }, err => {
                return res.status(400).json({
                    message: 'User not found',

                    status_code: 400
                });
            })
        }
    }
    static verifyUser(req: Request, res: Response) {
        const code = req.body.code;
        User.findOneAndUpdate({ code: code }, { verified: true }).exec().then((user) => {
            if (user) {
                return res.status(200).json({
                    message: 'User verified',

                    status_code: 200
                });
            } else {
                return res.status(400).json({
                    message: 'email not verified. please try by clicking send email again',
                    status_code: 200
                });
            }
        }, (err) => {
            return res.status(400).json({
                message: 'err' + err,

                status_code: 200
            });
        }).catch((err) => {
            res.status(500).send(err);
        })
    }

    static updateProfile(req: Request, res: Response) {
        const name = req.body.name;
        const job_category = req.body.job_category;
        const experience_level = req.body.experience_level;
        const userId = (req as any).userData.userID;
        if (!name) {
            res.status(422).json({
                message: "Please provide your name",
                status_code: 422
            });
        } else if (!experience_level) {
            res.status(422).json({
                message: "Please provide your Experience Level",
                status_code: 422
            });
        } else if (!job_category) {
            res.status(422).json({
                message: "Please provide your Job Category",
                status_code: 422
            });
        } else {
            const data = {
                name: name,
                job_category: job_category,
                experience_level: experience_level
            };
            User.findOneAndUpdate({ _id: userId }, data, { new: true }).exec().then((data) => {
                res.status(200).send(data);
            }).catch(err => {
                res.status(500).send(err)
            });
        }
    }

    static updateOnboarding(req: Request, res: Response) {
        const onboarding = req.body.onboarding;
        const userId = (req as any).userData.userID;
        if (!onboarding) {
            res.status(422).json({
                message: "Please provide value of onboarding",
                status_code: 422
            });
        } else {
            User.findOneAndUpdate({ _id: userId }, { onboarding: onboarding }, { new: true }).exec().then((data) => {
                res.status(200).send(data);
            }).catch(err => {
                res.status(500).send(err)
            });
        }
    }

    static updateName(req: Request, res: Response) {
        const name = req.body.name;
        const userId = (req as any).userData.userID;
        if (!name) {
            res.status(422).json({
                message: "Please provide your name",
                status_code: 422
            });
        } else {
            User.findOneAndUpdate({ _id: userId }, { name: name }, { new: true }).exec().then((data) => {
                res.status(200).send(data);
            }).catch(err => {
                res.status(500).send(err)
            });
        }
    }


    static InitializeApp(req: Request, res: Response) {
        res.status(200).json({
            message: 'App initialized successfully',
            status_code: 200
        })
    }
}


export function splitName(fullName: string): { firstName: string; lastName?: string } {
    const parts = fullName.trim().split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts.slice(1).join(' ') : undefined;
    return { firstName, lastName };
}