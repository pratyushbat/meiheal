require("dotenv").config()

import Razorpay from 'razorpay';
export const createRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'build_dummy_key',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'build_dummy_key'
    })
}
