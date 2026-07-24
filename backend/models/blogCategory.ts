
import { Schema, model, Types } from "mongoose";

// Interface for TypeScript
export interface IBlogCategory extends Document {
    name: string;
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    description?: string;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Mongoose Schema
const blogCategorySchema = new Schema<IBlogCategory>({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    seoTitle: String,
    seoDescription: String,
    description: String,
    image: String
}, {
    timestamps: true
});


const blogCategoryModel = model<IBlogCategory>("BlogCategory", blogCategorySchema);
export default blogCategoryModel;
