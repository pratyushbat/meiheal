import { IBlog } from './../models/blogModel';
import {
  Request,
  Response,
  RequestHandler,
} from "express";
import { sendError } from "../utils/sendError";
import mongoose from "mongoose";
import Blog from '../models/blogModel';
import Comment from '../models/commentModel';
import BlogCategory from "../models/blogCategory";

export class BlogController {
  // 1. GET /blogs (Fetch all categories)
  static getBlogAllCategories: RequestHandler = async (req: Request, res: Response) => {
    try {
      const categories = await BlogCategory.find();
      return res.status(200).json(categories);
    } catch (error) {
      return res.status(500).json({ message: 'Error fetching categories', error });
    }
  };
  // 2. GET /blogs/:categorySlug (Fetch a specific category and its posts)
  static getBlogCategoryBySlug: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { categorySlug } = req.params;
      // 1. Pagination Math: Get page and limit from query, set defaults
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10; // 10 posts per page
      const skip = (page - 1) * limit;
      // Find the category by its slug
      const category = await BlogCategory.findOne({ slug: categorySlug })
        .lean();
      //Note: check lean()
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      //NOTE: Without an index covering category + isPublished + createdAt below It is slow

      const [posts, totalPosts] = await Promise.all([
        Blog.find({ category: category._id, isPublished: true })
          .select('title slug featuredImage createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Blog.countDocuments({ category: category._id, isPublished: true })
      ]);

      const totalPages = Math.ceil(totalPosts / limit);
      return res.status(200).json({
        category, posts, pagination: {
          currentPage: page,
          totalPages: totalPages,
          totalPosts: totalPosts,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      });
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  };
  // 3. GET /blogs/:categorySlug/:postSlug (Fetch a specific blog post)
  static getBlogPostBySlug: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { categorySlug, postSlug } = req.params;

      const post = await Blog.findOne({ slug: postSlug, isPublished: true })
        .populate('category', 'name slug')
        .lean();

      if (!post || (post.category as any)?.slug !== categorySlug) {
        return res.status(404).json({ message: 'Blog post not found' });
      }

      return res.status(200).json(post);
    } catch (error) {
      return res.status(500).json({ message: 'Server error', error });
    }
  };



  // 1. createCategory /blogs (Fetch all categories)
  static createCategory: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { name, slug, description, seoTitle, seoDescription, image } = req.body;

      // 1. Check if the slug already exists (slugs must be unique)
      const existingCategory = await BlogCategory.findOne({ slug }).lean();
      //Note: check lean();
      if (existingCategory) {
        return res.status(400).json({ message: 'A category with this slug already exists.' });
      }

      // 2. Create and save the new category
      const newCategory = new BlogCategory({
        name,
        slug,
        description,
        seoTitle,
        seoDescription,
        image
      });

      const savedCategory = await newCategory.save();
      return res.status(201).json(savedCategory);

    } catch (error) {
      return res.status(500).json({ message: 'Failed to create category', error });
    }
  };

  // 1. createCategory /blogs (Fetch all categories)
  static updateCategory: RequestHandler = async (req: Request, res: Response) => {
    try {
      // 1. Grab the ID from the URL parameters
      const { categoryId } = req.params;
      const { name, slug, description, seoTitle, seoDescription, image } = req.body;

      // 2. Check if the category we are trying to update actually exists
      const categoryToUpdate = await BlogCategory.findById(categoryId);
      if (!categoryToUpdate) {
        return res.status(404).json({ message: 'Category not found to update.' });
      }

      // 3. If they are updating the slug, check if the NEW slug is already taken
      // We only care if it's taken by a DIFFERENT category.
      if (slug && slug !== categoryToUpdate.slug) {
        const slugExists = await BlogCategory.findOne({ slug }).lean();
        //Note: check lean();
        if (slugExists) {
          return res.status(400).json({ message: 'A category with this slug already exists.' });
        }
      }

      // 4. Perform the update
      // { new: true } tells Mongoose to return the updated document, not the old one
      // { runValidators: true } ensures your Schema rules (like 'required') are still enforced
      const updatedCategory = await BlogCategory.findByIdAndUpdate(
        categoryId,
        {
          name,
          slug,
          description,
          seoTitle,
          seoDescription,
          image
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json(updatedCategory);

    } catch (error) {
      return res.status(500).json({ message: 'Failed to create category', error });
    }
  };
  // 1. createBlogPost /blogs (Fetch all categories)
  static createBlogPost: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { title, slug, content, categoryId, author, seoTitle, seoDescription, featuredImage } = req.body;
      // 1. Check if the slug already exists
      const existingPost = await Blog.findOne({ slug }).lean();
      //Note: check lean();
      if (existingPost) {
        return res.status(400).json({ message: 'A blog post with this slug already exists.' });
      }

      // 2. Verify the category exists before linking it
      const category = await BlogCategory.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'The specified Category ID does not exist.' });
      }

      // 3. Create and save the new blog post
      const newPost = new Blog({
        title,
        slug,
        content,
        category: categoryId, // Link the post to the category
        author,
        seoTitle,
        seoDescription,
        featuredImage,
        isPublished: true // Defaulting to true as per your schema
      });

      const savedPost = await newPost.save();
      return res.status(201).json(savedPost);

    } catch (error) {
      return res.status(500).json({ message: 'Failed to create category', error });
    }
  };
  static updateBlogPost: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // Assuming the ID is passed in the route URL, e.g., /blogs/:id
      const { title, slug, content, categoryId, author, seoTitle, seoDescription, featuredImage, isPublished } = req.body;

      // 1. If a new slug is provided, check if it already exists for a DIFFERENT post
      if (slug) {
        const existingPost = await Blog.findOne({ slug, _id: { $ne: id } }).lean();
        //Note: check lean();
        if (existingPost) {
          return res.status(400).json({ message: 'A blog post with this slug already exists.' });
        }
      }

      // 2. If a categoryId is provided, verify the category exists before linking it
      if (categoryId) {
        const category = await BlogCategory.findById(categoryId);
        if (!category) {
          return res.status(404).json({ message: 'The specified Category ID does not exist.' });
        }
      }

      // 3. Prepare the update data
      // We map categoryId to category to match your create method's schema structure
      const updateData = { ...req.body };
      if (categoryId) {
        updateData.category = categoryId;
        delete updateData.categoryId;
      }

      // 4. Update the blog post
      const updatedPost = await Blog.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true } // 'new: true' returns the updated document, runValidators ensures schema rules are met
      );

      // 5. Check if the post was actually found and updated
      if (!updatedPost) {
        return res.status(404).json({ message: 'Blog post not found.' });
      }

      return res.status(200).json(updatedPost);

    } catch (error) {
      return res.status(500).json({ message: 'Failed to create category', error });
    }
  };

  // POST /blogs/:blogId/comments
  static addComment: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { blogId } = req.params;
      const { content, authorName, parentComment } = req.body;

      // 1. Verify the blog post actually exists
      const blogExists = await Blog.findById(blogId);
      if (!blogExists) {
        return res.status(404).json({ message: 'Blog post not found.' });
      }

      // 2. Create the comment
      const newComment = new Comment({
        content,
        authorName,
        blogPost: blogId,
        parentComment: parentComment || null // Null means it's a top-level comment
      });

      const savedComment = await newComment.save();
      return res.status(201).json(savedComment);

    } catch (error) {
      return res.status(500).json({ message: 'Failed to add comment', error });
    }

  }
  // GET /blogs/:blogId/comments
  static getCommentsForBlog: RequestHandler = async (req: Request, res: Response) => {
    try {
      const { blogId } = req.params;
      // 1. Fetch all approved comments for this specific blog post
      // Sorting by createdAt (1) ensures the oldest comments are at the top
      const comments = await Comment.find({
        blogPost: blogId,
        isApproved: true
      }).sort({ createdAt: 1 })
        .populate('author', 'firstName email');

      // 2. Structure the flat array into a parent/child thread system
      const commentMap = new Map();
      const threadedComments: any[] = [];

      // First pass: convert Mongoose documents to objects and add a 'replies' array
      comments.forEach(comment => {
        commentMap.set(comment._id.toString(), {
          ...comment.toObject(),
          replies: []
        });
      });

      // Second pass: Organize them into threads
      comments.forEach(comment => {
        if (comment.parentComment) {
          // If it has a parent, push it into the parent's 'replies' array
          const parent = commentMap.get(comment.parentComment.toString());
          if (parent) {
            parent.replies.push(commentMap.get(comment._id.toString()));
          }
        } else {
          // If it has no parent, it's a top-level comment
          threadedComments.push(commentMap.get(comment._id.toString()));
        }
      });

      // 3. Send the neatly threaded array to the frontend
      res.status(200).json(threadedComments);

    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch comments', error });
    }

  }

  static aggrCommand: RequestHandler = async (req: Request, res: Response) => {

    try {



      const result = await Blog.aggregate([
        {
          $lookup: {
            from: "comments",
            localField: "title",
            foreignField: "blogtitle",
            as: "comments"
          }
        }
      ]);
      return res.status(200).json({
        success: true,
        result: result,
      });
    } catch (error: any) {
      return sendError(res, 400, "Failed To Login 🙄", error?.message);
    }

  }
}













