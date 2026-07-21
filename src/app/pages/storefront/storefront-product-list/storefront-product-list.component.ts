



// features/product-list/product-list.component.ts
import { Component, inject, signal, computed, effect, PLATFORM_ID, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// import { StarRatingComponent } from '../star-rating.component';
import { ProductListResponse, ProductService } from '../../../services/product.service';
import { CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';
import { CartItemN, Product, ProductVariant } from '../../../models/product.model';
import { ToastService } from '../../../services/toastr.service';
import { UtilityService } from '../../../services/utility.service';

@Component({
  selector: 'storefront-product-list',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, FormsModule],
  template: `
    <section class="max-w-7xl mx-auto  sm:px-6   sm:py-12  ">
      <!-- Header -->
   <!--    <div class="flex flex-col gap-2 mb-8">
        <h1 class="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900">
          {{ categoryTitle() }}
        </h1>
        <p class="text-sm sm:text-base text-neutral-500">
         {{ products.length || 0 }} products
        </p>
      </div>
 -->
      <!-- Filter bar - sticky on mobile -->
      <div class="sticky top-0 z-10 -mx-4 px-4 sm:mx-0 sm:px-0 py-3 bg-white/95 backdrop-blur-sm border-b border-neutral-200 mb-6 flex items-center justify-between">
        <button
          (click)="filtersOpen.set(!filtersOpen())"
          class="inline-flex items-center gap-2 text-sm font-medium text-neutral-700 px-3 py-2 rounded-lg border border-neutral-300 active:scale-95 transition-transform"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 4h18M6 8h12M9 12h6M11 16h2" />
          </svg>
          Filters
        </button>

        <select
          [(ngModel)]="sortBy"
          class="text-sm font-medium border border-neutral-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="featured">Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      <!-- Product grid: 2 cols mobile, 3 tablet, 4 desktop -->
      <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
        @for (product of sortedProducts(); track product.id) {
            <a
            [routerLink]="['/products', product.slug]"
            class="group flex flex-col bg-white rounded-xl sm:rounded-2xl border border-neutral-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <!-- Image -->
            <div class="relative aspect-square bg-neutral-100 overflow-hidden">
              <img
                [src]="product.thumbnail"
                [alt]="product.name"
                loading="lazy"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              @if (product.compareAtPrice) {
                <span class="absolute top-2 left-2 bg-rose-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full">
                  {{ discountPercent(product) }}% OFF
                </span>
              }
            @if(isProductOutOfStock(product)){
               <button   
                (click)="$event.preventDefault(); $event.stopPropagation();cart.toggleWishlist(product.id)"
                class="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm active:scale-90 transition-transform"
                [attr.aria-label]="'Add ' + product.name + ' to wishlist'"
              >
                <svg class="w-4 h-4" [class.fill-rose-600]="cart.isWishlisted(product.id)" [class.text-rose-600]="cart.isWishlisted(product.id)" [class.text-neutral-400]="!cart.isWishlisted(product.id)" viewBox="0 0 24 24" stroke="currentColor" fill="none" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              </button>
            }
 
              <!-- Quick Add to Cart -->
               <!-- sm:opacity-0 sm:group-hover:opacity-100  -->
                     @if(!isProductOutOfStock(product)){
              <button
                (click)="$event.preventDefault(); $event.stopPropagation(); quickAdd(product)"
                class="absolute bottom-2 right-2 flex items-center gap-1.5 bg-rose-600 text-white text-xs font-semibold pl-2.5 pr-3 py-2 rounded-full shadow-md
                       opacity-100 translate-y-0 sm:translate-y-1 sm:group-hover:translate-y-0
                       transition-all duration-200 active:scale-90 hover:bg-rose-700"
                [attr.aria-label]="'Add ' + product.name + ' to cart'"
              >
                @if (justAdded() === product.id) {
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Added
                } @else {
                  <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.99-4.694 2.6-7.152.084-.337-.17-.66-.516-.66H5.106M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                  </svg>
                  Add
                }
              </button>
                     }
            </div>
 
            <!-- Info -->
            <div class="flex flex-col flex-1 p-3 sm:p-4 gap-1">
              <span class="text-[11px] sm:text-xs text-neutral-400 font-medium uppercase tracking-wide">{{ product.brand }}</span>
              <h3 class="text-sm sm:text-base font-medium text-neutral-900 line-clamp-2 leading-snug">
                {{ product.name }}
              </h3>
 
              <div class="flex items-center gap-1 text-amber-500 text-xs">
                <span>★</span>
                <span class="text-neutral-500">{{ product.rating }}</span>
                <span class="text-neutral-400">({{ product.reviewCount }})</span>
              </div>
 
              <div class="flex items-baseline gap-2 mt-auto pt-2">
                <span class="text-base sm:text-lg font-semibold text-neutral-900">
                  {{ product.price | currency: product.currency }}
                  @if(product.maxPrice > product.price){
                    <span > – ₹{{ product.maxPrice }}</span>
                  } 
                </span>
                @if (product.compareAtPrice) {
                  <span class="text-xs sm:text-sm text-neutral-400 line-through">
                    {{ product.compareAtPrice | currency: product.currency }}
                  </span>
                }
              </div>
               <button
    (click)="$event.preventDefault(); $event.stopPropagation(); buyNow(product)"
    class="w-full mt-2 bg-neutral-900 text-white text-xs sm:text-sm font-semibold py-2 rounded-lg
           active:scale-95 transition-transform hover:bg-neutral-800"
  >
    Buy Now
  </button>
            </div>
          </a>

        }
      </div>

      <!-- Empty state -->
      @if (sortedProducts().length === 0) {
        <div class="text-center py-16 text-neutral-500">No products match your filters.</div>
      }
    </section>
  `,
})
export class StoreFrontProductListComponent {
  private toast = inject(ToastService);
  private _uilityService = inject(UtilityService);
  cart = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  productListRes = signal<ProductListResponse | null>(this.route.snapshot.data['productList']);
  products = computed(() => this.productListRes()?.products ?? []);
  total = computed(() => this.productListRes()?.total ?? 0);

  categoryTitle = signal('All Products');
  filtersOpen = signal(false);
  sortBy = signal<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  wishlist = signal<Set<string>>(new Set());
  platformId = inject(PLATFORM_ID);

  isProductOutOfStock(product: Product): boolean {
    return product.variants.every(v => v.stock <= 0);
  }

  getQuickAddVariant(product: Product): ProductVariant | undefined {
    const preferred = product.variants.find(v => v.sku === product.defaultVariantSku);
    if (preferred && preferred.stock > 0) return preferred;
    return product.variants.find(v => v.stock > 0); // fallback to any in-stock variant
  }

  buyNow(product: Product) {
    const variant = product.variants.find(v => v.sku === product.defaultVariantSku)
    if (!variant || variant.stock <= 0) return;
    // let dataApi: any = this._uilityService.toCreateOrderRequest(product, 'product');
    // console.log('added buy now cart item', dataApi);
    this.cart.createBuyNowSession({
      productId: product.id,
      type: 'product',
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      thumbnail: product.thumbnail,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      currency: product.currency,
      qty: 1,
      rating: product.rating,
      reviewCount: product.reviewCount,
      selectedColor: variant.color,
      selectedSize: variant.size,
      maxStock: variant.stock,
    }).subscribe({
      next: (res: any) => {
        this.justAdded.set(product.id);
        this.isLoading = false;
        this.router.navigate(['/checkout'], { queryParams: { buyNow: res.sessionId } });
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong while quickAddApi');
        this.isLoading = false;
      },
    });

  }

  constructor() { }


  // StarRatingComponent rem
  readonly justAdded = signal<string | null>(null);

  // quickAddA(product: Product) {

  //   this.cart.addToCart(product, 1, true); // true = open the drawer, matches screenshot behaviour
  //   this.justAdded.set(product.id);
  //   setTimeout(() => {
  //     if (this.justAdded() === product.id) this.justAdded.set(null);
  //   }, 1200);
  // }
  isLoading: boolean = false;
  quickAdd(product: Product) {
    const variant = product.variants.find(v => v.sku === product.defaultVariantSku)
    if (!variant || variant.stock <= 0) return;

    // let dataApi: Partial<CartItemN> = this._uilityService.toCreateOrderRequest(product, 'product');
    // if (dataApi.isOutOfStock)
    //   return;

    this.isLoading = true;
    this.cart.addToCartAPI({
      productId: product.id,
      type: 'product',
      sku: variant.sku,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      thumbnail: product.thumbnail,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      currency: product.currency,
      qty: 1,
      rating: product.rating,
      reviewCount: product.reviewCount,
      selectedColor: variant.color,
      selectedSize: variant.size,
      maxStock: variant.stock,
    }).subscribe({
      next: (res: any) => {
        this.justAdded.set(product.id);
        this.isLoading = false;
        this.getCartApi();

      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong while quickAddApi');
        this.isLoading = false;
      },
    });
  }

  getCartApi() {

    this.cart.getCartAPI().subscribe({
      next: (res: any) => {
        // console.log('cart ---', res.items ?? [])
        const cartMap = res.items.map((item: any) => ({
          ...item,
          priceAtPurchase: item.price, // or whatever value you want
        }));
        this.cart.addManyToCart(cartMap ?? []);
        this.isLoading = false;
        this.cart.open();
        // this.toast.showSuccess('Cart recievved successfully!');
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong while quickAddApi');
        this.isLoading = false;
      },
    });
  }

  sortedProducts = computed(() => {
    const list = [...this.products()];
    switch (this.sortBy()) {
      case 'price-asc': return list.sort((a, b) => a.price - b.price);
      case 'price-desc': return list.sort((a, b) => b.price - a.price);
      case 'rating': return list.sort((a, b) => b.rating - a.rating);
      default: return list;
    }
  });

  discountPercent(p: any) {
    return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
  }

  isWishlisted(id: string) { return this.wishlist().has(id); }

  toggleWishlist(id: string) {
    this.wishlist.update((set) => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
}

