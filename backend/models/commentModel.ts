
import { Schema, model, Types, Document } from "mongoose";
export type UserRole = 'user' | 'admin' | 'moderator';


export interface IComment extends Document {
  content: string;
  authorName: string;
  author: Types.ObjectId;
  blogPost: Types.ObjectId;
  parentComment?: Types.ObjectId; // 👈 This makes replies possible
  isApproved: boolean;
  createdAt: Date;

}

const commentSchema = new Schema<IComment>({
  content: { type: String, required: true },
  authorName: { type: String, required: true },
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  blogPost: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  // If this is a reply, it holds the ID of the comment it is replying to.
  // If it is a top-level comment, this field is null/empty.
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
  isApproved: { type: Boolean, default: false } // Good for moderating spam
}, {
  timestamps: true
});


const commentModel = model<IComment>("Comment", commentSchema);
export default commentModel;