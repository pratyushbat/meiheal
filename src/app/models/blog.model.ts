// src/app/models/blog.model.ts

import { Types } from 'mongoose';

export interface BlogCategory {
    _id: string;
    name: string;
    slug: string;
    seoTitle?: string;
    seoDescription?: string;
    description?: string;
    image?: string;
    createdAt?: Date;
    updatedAt: Date;
}

export interface BlogPost {
    _id: string;
    title: string;
    slug: string;
    author?: string;
    likes: number;
    category: BlogCategory;
    content: string;
    seoTitle?: string;
    seoDescription?: string;
    featuredImage?: string;
    isPublished: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BlogCategory {
    _id: string;
    name: string;
    slug: string;

}
export interface SingleBlogPost {
    category: CategoryDetail;
    pagination: Pagination;
    posts: BlogPost[];
}

export interface Pagination {
    currentPage: number;
    totalPages: number;
    totalPosts: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}
export interface Comment {
    _id: string;
    content: string;
    authorName: string;
    blogPost: Types.ObjectId;
    parentComment?: Types.ObjectId; // 👈 This makes replies possible
    replies?: Comment[];
    isApproved: boolean;
    createdAt: Date;
}

export interface CategoryDetail {
    _id: string;
    name: string;
    slug: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    seoDescription: string;
    seoTitle: string;
    image: string;
}
