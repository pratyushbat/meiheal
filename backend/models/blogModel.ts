
import { Schema, model, Types } from "mongoose";


export interface IBlog extends Document {
  title: string;
  slug: string;
  author?: string;
  likes?: number;
  category: Types.ObjectId;
  content: string;
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const blogSchema = new Schema<IBlog>({
  title: {
    type: String,
    required: [true, "please enter title"],
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  author: {
    type: String,
    required: false
  },
  likes: { type: Number },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'BlogCategory',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  seoTitle: String,
  seoDescription: String,
  featuredImage: String,
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});
blogSchema.index({ category: 1, isPublished: 1, createdAt: -1 });

const blogModel = model<IBlog>("Blog", blogSchema);
export default blogModel;