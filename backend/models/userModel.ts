import moment from "moment";
import mongoose, { Schema, model, Types, Document } from "mongoose";
export type UserRole = 'user' | 'admin' | 'moderator';


export interface IAddress {
  _id: Types.ObjectId;
  fullName: string;
  phone: string;
  address: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;


}
export const addressSchema = new mongoose.Schema<IAddress>(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    locality: { type: String, required: true },
    landmark: String, // optional is fine here
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: [/^\d{6}$/, 'Pincode must be exactly 6 digits'] },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password?: string; // 👈 Added '?' because guests don't have passwords
  userLocationData?: object;
  profilePic?: string;
  role: UserRole;      // 👈 Changed 'String' to 'string'
  isGuest: boolean;  // 👈 ADDED THIS! Must match the schema below.
  addresses?: Types.DocumentArray<IAddress>; // Assuming IAddress is defined elsewhere
  // 👇 Add these two optional fields
  setupToken?: string;
  setupTokenExpire?: Date;
  code?: string;
  codeExpiry?: Date;
  last_active?: Date;
  createdAt?: Date;
  verified: boolean;
}

export const userSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, "please enter firstName"],
    trim: true,
  },
  lastName: {
    type: String,
    required: false // 👈 'required: [false]' is invalid Mongoose syntax, just use false
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: [true, "please enter email"],
    match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
  },
  phone: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false
  },
  profilePic: {
    type: String,
    trim: true,
    required: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
    required: [true, "please enter role"],
  },
  isGuest: {
    type: Boolean,   // 👈 Changed to Boolean
    default: true,   // 👈 Defaults to true automatically
  },
  userLocationData: { type: Schema.Types.Mixed },
  addresses: { type: [addressSchema], default: [] },     // Assuming addressSchema is defined above this
  // 👇 Add the schema definitions here
  setupToken: {
    type: String,
    required: false
  },
  setupTokenExpire: {
    type: Date,
    required: false
  },
  code: { type: String, required: false },
  codeExpiry: {
    type: Date,
    required: false
  },

  last_active: { type: Date, required: false, default: () => new Date() },
  verified: { type: Boolean, default: false },
}, { timestamps: true });


const userModel = model<IUser>("User", userSchema);

export default userModel;


//Note: .toLowerCase()) anywhere you query by email manually in controllers (User.findOne({ email })),