import {
  Request,
  Response,
  RequestHandler,
} from "express";

import { QueryFilter } from 'mongoose';
const slugify = require('slugify');

import Product, { IProduct, IProductDimension, IProductVariant } from '../models/productsModel';



const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;


// Maps Mongo's _id -> id and drops __v so responses match the frontend Product shape.
const serialize = (doc: any) => {
  const { _id, __v, ...rest } = doc;
  return { id: _id.toString(), ...rest };
};

// --- Dimension validation helpers (new) ---

// A dimension object is valid if all four values exist and are > 0.
const isValidDimension = (dim?: IProductDimension): boolean => {
  if (!dim) return false;
  const { length, width, height, weight } = dim;
  return [length, width, height, weight].every(
    (v) => typeof v === 'number' && v > 0
  );
};

// Every variant must carry both product_dimensions and packed_dimensions,
// since packed_dimensions is what gets sent to Shiprocket at order time.
// Returns null if all good, or a message naming the first bad variant.
const validateVariantDimensions = (variants: IProductVariant[] = []): string | null => {
  for (const v of variants) {
    if (!isValidDimension(v.product_dimensions)) {
      return `Variant "${v.sku}": product_dimensions is missing or has invalid values`;
    }
    if (!isValidDimension(v.packed_dimensions)) {
      return `Variant "${v.sku}": packed_dimensions is missing or has invalid values`;
    }
  }
  return null;
};



// Fetch a paginated/filterable product list.
export const getProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      sortBy = 'featured',
      minPrice,
      maxPrice,
      page = '1',
      pageSize = String(DEFAULT_PAGE_SIZE),
      search,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const size = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize, 10) || DEFAULT_PAGE_SIZE));

    const filter: QueryFilter<IProduct> = { isActive: true };

    if (category) filter.category = category;


    if (minPrice || maxPrice) {
      // Overlap check: a product matches if ANY of its variants could fall
      // inside the requested range — not just its cheapest ("from") price.
      // price = cheapest variant, maxPrice = priciest variant.
      const conditions: any[] = [];
      if (maxPrice) conditions.push({ price: { $lte: Number(maxPrice) } });
      if (minPrice) conditions.push({ maxPrice: { $gte: Number(minPrice) } });
      filter.$and = conditions;
    }


    if (search) {
      filter.$text = { $search: search };
    }

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'price-asc': { price: 1 },
      'price-desc': { price: -1 },
      rating: { rating: -1 },
      featured: { createdAt: -1 }, // swap for a real "featured" weight/flag later
    };
    const sort = sortMap[sortBy] || sortMap.featured;

    const [products, total] = await Promise.all([
      Product.find(filter).sort(sort).skip((pageNum - 1) * size).limit(size).lean(),
      Product.countDocuments(filter),
    ]);

    return res.json({
      products: products.map(serialize),
      total,
      page: pageNum,
      pageSize: size,
    });
  } catch (err) {
    console.error('getProducts error:', err);
    return res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Fetch a single product by slug — used by the detail page resolver.
export const getBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isActive: true }).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(serialize(product));
  } catch (err) {
    console.error('getBySlug error:', err);
    return res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Related products for the detail page ("You might also like").
export const getRelated = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '8'), 10)));

    const current = await Product.findOne({ slug }).select('_id category tags').lean();
    if (!current) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const related = await Product.find({
      _id: { $ne: current._id },
      isActive: true,
      $or: [{ category: current.category }, { tags: { $in: current.tags || [] } }],
    })
      .sort({ rating: -1 })
      .limit(limit)
      .lean();

    return res.json(related.map(serialize));
  } catch (err) {
    console.error('getRelated error:', err);
    return res.status(500).json({ message: 'Failed to fetch related products' });
  }
};

// Fetch a single product by Mongo _id — used by admin edit forms.
export const getById = async (req: Request, res: Response) => {
  try {
    // console.log('------getById')
    const product = await Product.findById(req.params.id).lean();

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(serialize(product));
  } catch (err) {
    console.error('getById error:', err);
    return res.status(500).json({ message: 'Failed to fetch product' });
  }
};

// Create a new product (admin).
export const createProduct = async (req: Request, res: Response) => {
  try {
    console.log(req.body)
    const dimensionError = validateVariantDimensions(req.body.variants);
    if (dimensionError) {
      return res.status(400).json({ message: dimensionError });
    }

    const product = await Product.create(req.body);
    return res.status(201).json(serialize(product.toObject()));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'A product with this slug or SKU already exists' });
    }
    console.error('createProduct error:', err);
    return res.status(400).json({ message: 'Failed to create product', error: err.message });
  }
};

// Update an existing product by id (admin).
export const updateProduct = async (req: Request, res: Response) => {
  try {

    if (req.body.variants) {
      const dimensionError = validateVariantDimensions(req.body.variants);
      if (dimensionError) {
        return res.status(400).json({ message: dimensionError });
      }
    }


    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(serialize(product.toObject()));
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Slug or SKU already in use' });
    }
    console.error('updateProduct error:', err);
    return res.status(400).json({ message: 'Failed to update product', error: err.message });
  }
};

// Soft-delete a product (admin) — keeps past orders pointing at a valid product record.
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json({ message: 'Product deactivated', product: serialize(product.toObject()) });
  } catch (err) {
    console.error('deleteProduct error:', err);
    return res.status(500).json({ message: 'Failed to delete product' });
  }
};




/* export const allProductsList: RequestHandler = async (req: Request, res: Response) => {
  try {
    const products = await productModel.find().sort({ price: 1 });
    res.json(products);

  } catch (error: any) {
    sendError(res, 400, "Failed To Login 🙄", error?.message);
  }
};

export const productById: RequestHandler = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id as string)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product id'
      });
    }
    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: product
    });

  } catch (error: any) {
    return sendError(res, 400, "Failed To Login 🙄", error?.message);
  }
};


export const createProduct: RequestHandler = async (
  req: Request | any,
  res: Response
) => {
  try {
    const { name, description, price } = req.body;


    const newProduct = await productModel.create({
      name,
      slug: slugify(name, { lower: true }),
      description,
      price: Number(price),
    });
    return res.status(200).json({
      success: true,
      product: newProduct,
    });

  }
  catch (error: any) {
    return sendError(res, 400, "Failed to create Products otp", error);
  }
}; */



