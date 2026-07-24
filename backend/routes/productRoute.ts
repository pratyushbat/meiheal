import { Router } from "express";
import { createProduct, deleteProduct, getById, getBySlug, getProducts, getRelated, updateProduct } from "../controllers/productController";

// import { requireAuth, requireAdmin } from '../middleware/auth'; // wire in your existing middleware

const route = Router();

// Public
route.get('/', getProducts);
route.get('/slug/:slug', getBySlug);
route.get('/slug/:slug/related', getRelated);

// Admin — protect all four of these before shipping
route.get('/:id', /* requireAuth, requireAdmin, */ getById);
route.post('/', /* requireAuth, requireAdmin, */ createProduct);
route.put('/:id', /* requireAuth, requireAdmin, */ updateProduct);
route.delete('/:id', /* requireAuth, requireAdmin, */ deleteProduct);
export default route;
