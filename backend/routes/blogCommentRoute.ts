import { Router } from 'express';

import { BlogController } from '../controllers/blogController';

const route: Router = Router();
// Route: /blogs

// New: Add a comment to a specific blog
route.post('/:blogId/comments', BlogController.addComment);
route.get('/:blogId/comments', BlogController.getCommentsForBlog);


// --- POST ROUTES (Create Data) ---
route.post('/category', BlogController.createCategory);
route.put('/category/:categoryId', BlogController.updateCategory);
route.post('/post', BlogController.createBlogPost);
route.put('/post/:id', BlogController.updateBlogPost);

// Returns all categories
route.get('/', BlogController.getBlogAllCategories);
// Route: /blogs/weight-loss
route.get('/:categorySlug', BlogController.getBlogCategoryBySlug);
// Route: /blogs/weight-loss/7-day-weight-loss-diet-plan
route.get('/:categorySlug/:postSlug', BlogController.getBlogPostBySlug);

export default route;
