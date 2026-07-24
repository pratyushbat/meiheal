import { Schema, model } from "mongoose";



const leadSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  },

  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email']
  },

  phone: {
    type: String,
    trim: true,
    maxlength: 15
  },

  subject: {
    type: String,
    trim: true,
    maxlength: 150
  },

  message: {
    type: String,
    required: true,
    trim: true,
    minlength: 10
  },
  interest: {
    type: String,
    required: false,
  },

  status: {
    type: String,
    enum: ['new', 'read', 'replied'],
    default: 'new'
  },

  leadLocationData: { type: Object },
  userAgent: String


}, { timestamps: true });

const leadModel = model("Lead", leadSchema);

export default leadModel;
