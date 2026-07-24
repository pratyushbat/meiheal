
import { Schema, model, Types } from "mongoose";





export interface IOAuthAccount extends Document {
    userId: Types.ObjectId;
    provider: "google" | "github";
    providerAccountId: string;
    createdAt: Date;
}


const oauthAccountSchema = new Schema<IOAuthAccount>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    provider: {
        type: String,
        enum: ["google", "github"],
        required: true,
    },

    providerAccountId: {
        type: String,
        required: true,
        unique: true,
        maxLength: 255
    },

    createdAt: {
        type: Date,
        default: Date.now,
        required: true
    },
});

oauthAccountSchema.index(
    { userId: 1, provider: 1 },
    { unique: true }
);

const OAuthAccount = model<IOAuthAccount>("OAuthAccount", oauthAccountSchema);
export default OAuthAccount;