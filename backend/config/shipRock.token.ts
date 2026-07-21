require("dotenv").config()

let cachedToken: string | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

export async function getShiprocketToken(): Promise<string> {
    console.log('process.env.SHIPROCKET_EMAIL', process.env.SHIPROCKET_EMAIL)
    console.log('process.env.SHIPROCKET_PASSWORD', process.env.SHIPROCKET_PASSWORD)
    if (cachedToken && Date.now() - tokenFetchedAt < TOKEN_TTL_MS) {
        return cachedToken;
    }
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD,
        }),
    });
    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Shiprocket login failed (${response.status}): ${errBody}`);
    }
    const data = await response.json();
    if (!data.token) throw new Error('Failed to authenticate with Shiprocket');
    cachedToken = data.token;
    tokenFetchedAt = Date.now();
    // console.log('cachedToken', cachedToken)
    return cachedToken as string;
}
