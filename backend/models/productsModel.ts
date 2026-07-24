import { Schema, model, Document } from 'mongoose';

export interface IProductDimension {
  length: number;
  width: number;
  height: number;
  weight: number;
}
export interface IProductVariant {
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  price: number,
  compareAtPrice: number,
  product_dimensions: IProductDimension,
  packed_dimensions: IProductDimension
}

// export interface IProductColor {
//   name: string;
//   hex: string;
// }

export interface IProduct extends Document {
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[];
  thumbnail: string;
  shortDescription?: string;
  description?: string;
  features?: string[];
  variants: IProductVariant[];
  defaultVariantSku?: string;
  maxPrice: number;
  // colors?: IProductColor[];
  // sizes?: string[];
  stock: number;
  category: string;
  tags?: string[];
  sku: string;
  isActive: boolean; // soft-delete flag — keeps historical orders pointing at a valid product
  createdAt: Date;
  updatedAt: Date;
}
const ProductDimensionSchema = new Schema<IProductDimension>(
  {
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 },
    weight: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);


const ProductVariantSchema = new Schema<IProductVariant>(
  {
    sku: { type: String, required: true },
    color: { type: String },
    size: { type: String },
    stock: { type: Number, required: true, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    product_dimensions: { type: ProductDimensionSchema, required: true },
    packed_dimensions: { type: ProductDimensionSchema, required: true },

  },
  { _id: false }
);

// const ProductColorSchema = new Schema<IProductColor>(
//   {
//     name: { type: String, required: true },
//     hex: { type: String, required: true },
//   },
//   { _id: false }
// );

const ProductSchema = new Schema<IProduct>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, required: true, default: 'INR' },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    thumbnail: { type: String, required: true },
    shortDescription: { type: String },
    description: { type: String },
    features: { type: [String], default: [] },
    variants: { type: [ProductVariantSchema], default: [] },
    defaultVariantSku: { type: String },
    stock: { type: Number, required: true, default: 0, min: 0 },
    category: { type: String, required: true },
    tags: { type: [String], default: [] },
    sku: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
    maxPrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

// Search + common filter combinations
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });
ProductSchema.index({ category: 1, price: 1, maxPrice: 1 });
ProductSchema.index({ isActive: 1 });

// Auto-generate a slug from the name if one isn't supplied.
// // Auto-compute top-level price and stock from variants before every save,
// so they can never drift from the actual variant data.
ProductSchema.pre('validate', function () {
  if (this.variants && this.variants.length > 0) {
    const prices = this.variants.map((v) => v.price);
    this.price = Math.min(...prices);
    this.maxPrice = Math.max(...prices);
    this.stock = this.variants.reduce((sum, v) => sum + v.stock, 0);

    const compareAtPrices = this.variants
      .map((v) => v.compareAtPrice)
      .filter((p): p is number => typeof p === 'number');
    if (compareAtPrices.length > 0) {
      this.compareAtPrice = Math.min(...compareAtPrices);
    }
  }

  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  }
});

ProductSchema.path('variants').validate(function (variants: IProductVariant[]) {
  return variants && variants.length > 0;
}, 'Product must have at least one variant');


ProductSchema.path('defaultVariantSku').validate(function (sku: string) {
  if (!sku) return true; // optional — falls back to variants[0] on the frontend
  return this.variants.some(v => v.sku === sku);
}, 'defaultVariantSku must match an existing variant SKU');

ProductSchema.path('defaultVariantSku').validate(function (sku: string) {
  if (!sku) return true; // optional — falls back to variants[0] on the frontend
  return this.variants?.some((v) => v.sku === sku) ?? false;
}, 'defaultVariantSku must match an existing variant SKU');

export default model<IProduct>('Product', ProductSchema);
