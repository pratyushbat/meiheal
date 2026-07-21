// ecom product model
/* export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string[];
  price: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
} */
// isDeleted: boolean;
// createdAt: string;
// updatedAt: string;
// core/models/product.model.ts
export interface ProductDimension {
  length: number;
  width: number;
  height: number;
  weight: number;
}

export interface ProductVariant {
  sku: string;
  color?: string;
  size?: string;
  stock: number;
  price: number;
  compareAtPrice?: number;
  product_dimensions: ProductDimension;
  packed_dimensions: ProductDimension;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice?: number;
  maxPrice: number;
  currency: string;
  rating: number;
  reviewCount: number;
  images: string[];
  thumbnail: string;
  shortDescription?: string;
  description?: string;
  features: string[];
  variants: ProductVariant[];
  defaultVariantSku?: string;
  stock: number;
  category: string;
  tags: string[];
  sku: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  _id?: any;
  productId: string;      // back-reference to the full Product, for re-fetching if needed
  sku: string;             // the exact variant SKU being purchased
  slug: string;
  name: string;
  brand: string;
  thumbnail: string;
  price: number;           // snapshot at add-time
  compareAtPrice?: number;
  currency: string;
  qty: number;
  rating: number;          // copied for display/reassurance only, not recalculated
  reviewCount: number;
  selectedColor?: string;
  selectedSize?: string;
  maxStock?: number;       // caps the qty stepper against available stock
}

export interface CartItemN {
  _id?: string;              // the cart line's own id - needed to target update/remove on THIS line
  productId: string;        // back-reference to the full Product, for re-fetching if needed
  type: 'product' | 'subscription';
  sku?: string;              // variant SKU - only relevant for type: 'product'
  slug: string;
  name: string;
  brand: string;
  thumbnail: string;
  price: number;             // snapshot at add-time - re-validated server-side at checkout, never trusted for charging
  priceAtPurchase: number;             // snapshot at add-time - re-validated server-side at checkout, never trusted for charging
  compareAtPrice?: number;
  currency: string;
  qty: number;                // subscriptions should always be qty: 1 - enforce in addToCart, not just UI
  rating: number;              // copied for display/reassurance only, never recalculated
  reviewCount: number;
  selectedColor?: string;      // product-only
  selectedSize?: string;       // product-only
  maxStock?: number;           // product-only - caps the qty stepper
  billingInterval?: 'monthly' | 'yearly'; // subscription-only
  isOutOfStock?: boolean;
}


export interface UpsellProduct {
  id: string;
  name: string;
  thumbnail: string;
  price: number;
  currency: string;
  rating: number;
}