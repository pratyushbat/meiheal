import { CartItemN } from './../models/product.model';

import { Injectable, computed, signal, inject, PLATFORM_ID } from '@angular/core';
import { Product, UpsellProduct } from '../models/product.model';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

@Injectable({ providedIn: 'root' })
export class CartService {

    private http = inject(HttpClient);
    // ---- state ----
    private readonly _items = signal<CartItemN[]>([]);
    private readonly _isOpen = signal(false);
    private readonly _wishlist = signal<Set<string>>(new Set());

    // upsell rail shown inside the drawer ("Make your intimate moments even hotter")
    readonly upsells = signal<UpsellProduct[]>([]);

    // ---- public readonly views ----
    readonly items = this._items.asReadonly();
    readonly isOpen = this._isOpen.asReadonly();

    readonly totalItems = computed(() =>
        this._items().reduce((sum, i) => sum + i.qty, 0)
    );

    readonly finalPrice = computed(() =>
        this._items().reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0)
    );

    readonly compareAtTotal = computed(() =>
        this._items().reduce(
            (sum, i) => sum + (i.compareAtPrice ?? i.priceAtPurchase) * i.qty,
            0
        )
    );

    readonly isEmpty = computed(() => this._items().length === 0);

    constructor() {
        // this.ensureSessionId();// client side Application will work
    }


    // ---- actions ----
    // product any
    addToCart(
        product: Product,
        qty = 1,
        openDrawer = true,
        selectedColor?: string,
        selectedSize?: string
    ) {
        // A product + a specific variant selection = one distinct cart line.
        // Same product, different variant (e.g. different size) = a separate line.
        const sku = selectedColor || selectedSize
            ? `${product.sku}-${selectedColor ?? ''}-${selectedSize ?? ''}`
            : product.sku;

        this._items.update((items) => {
            const existing = items.find((i) => i.sku === sku);
            if (existing) {
                return items.map((i) =>
                    i.sku === sku ? { ...i, qty: i.qty + qty } : i
                );
            }
            const snapshot: CartItemN = {
                productId: product.id,
                sku,
                type: 'product', // Note: hardocoded type
                slug: product.slug,
                name: product.name,
                brand: product.brand,
                thumbnail: product.thumbnail,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                priceAtPurchase: product.price,
                currency: product.currency,
                qty,
                rating: product.rating,
                reviewCount: product.reviewCount,
                selectedColor,
                selectedSize,
                maxStock: product.stock,
            };
            return [...items, snapshot];
        });
        if (openDrawer) this.open();
    }


    updateQty(item: CartItemN, delta: number) {
        const next = item.qty + delta;
        const capped = item.maxStock ? Math.min(next, item.maxStock) : next;
        const newQty = Math.max(0, capped);

        // optimistic — instant UI feedback
        this._items.update((items) =>
            items
                .map((i) => i._id === item._id ? { ...i, qty: newQty } : i)
                .filter((i) => i.qty > 0)
        );

        if (newQty === 0) {
            this.http.delete(`/api/cart/item/${item._id}`).subscribe({
                next: () => this.syncCartFromServer(),
                error: () => this.syncCartFromServer() // pull back the real state if it failed
            });
            return;
        }

        this.http.patch(`/api/cart/item/${item._id}`, { qty: newQty }).subscribe({
            next: () => this.syncCartFromServer(),
            error: () => this.syncCartFromServer()
        });
    }



    removeItem(item: CartItemN) {
        // optimistic — remove immediately from the UI
        this._items.update((items) => items.filter((i) => i._id !== item._id));

        this.http.delete(`/api/cart/item/${item._id}`).subscribe({
            next: () => this.syncCartFromServer(),
            error: () => {
                this.syncCartFromServer(); // undo the optimistic removal if the API call actually failed
            }
        });
    }

    clearCart() {
        this._items.set([]);
    }

    toggleWishlist(productId: string) {
        this._wishlist.update((set) => {
            const next = new Set(set);
            next.has(productId) ? next.delete(productId) : next.add(productId);
            return next;
        });
    }

    isWishlisted(productId: string): boolean {
        return this._wishlist().has(productId);
    }

    open() {
        this._isOpen.set(true);
    }

    close() {
        this._isOpen.set(false);
    }

    toggle() {
        this._isOpen.update((v) => !v);
    }


    syncCartFromServer() {
        this.getCartAPI().subscribe({
            next: (res: any) => {
                const cartMap = res.items.map((item: any) => ({
                    ...item,
                    priceAtPurchase: item.price, // or whatever value you want
                }));
                this._items.set(cartMap ?? [])
            },
            error: () => {
                // keep whatever's already in _items rather than wiping it on a failed fetch
            }
        });
    }
    addToCartAPI(data: any) {
        return this.http.post("/api/cart/add", data);
    }

    getCartAPI() {
        return this.http.get("/api/cart");
    }

    createBuyNowSession(data: any) {
        return this.http.post("/api/checkout/buy-now", data);
    }
    buyNowSession(sessionId: string) {
        return this.http.get("/api/checkout/buy-now/" + sessionId);
    }

    addManyToCart(entries: CartItemN[], openDrawer = false) {
        this.clearCart();
        this._items.update((items) => {
            let next = [...items];

            for (const entry of entries) {
                // mirrors backend's own matching logic: productId + variant = one line
                const existingIndex = next.findIndex((i) =>
                    i.productId === entry.productId &&
                    i.selectedColor === entry.selectedColor &&
                    i.selectedSize === entry.selectedSize
                );

                if (existingIndex !== -1) {
                    const existing = next[existingIndex];
                    const newQty = existing.qty + entry.qty;
                    next[existingIndex] = {
                        ...existing,
                        qty: existing.maxStock ? Math.min(newQty, existing.maxStock) : newQty,
                    };
                } else {
                    next.push({ ...entry });
                }
            }

            return next;
        });

        if (openDrawer) this.open();
    }
    // platformId = inject(PLATFORM_ID);
    // cart.service.ts — call this once, e.g. in an APP_INITIALIZER
    /*    private ensureSessionId() {
           if (!isPlatformBrowser(this.platformId)) return; // skip on SSR
           let id = localStorage.getItem('cartSessionId');
           if (!id) {
               id = crypto.randomUUID();
               localStorage.setItem('cartSessionId', id);
           }
           this.sessionId = id;
       }
    */
    // sessionId!: string;

}
