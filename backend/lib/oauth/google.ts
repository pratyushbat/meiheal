import { env } from "process";
import { Google } from "arctic";

let googleClientId: string = process.env.GOOGLE_CLIENT_ID || "";
let googleClientSecret: string = process.env.GOOGLE_CLIENT_SECRET || "";
export const google = new Google(
    googleClientId,
    googleClientSecret,
    'https://meiheal.com/google/callback',
);