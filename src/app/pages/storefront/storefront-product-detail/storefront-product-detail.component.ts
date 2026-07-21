// features/product-detail/product-detail.component.ts
import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StarRatingComponent } from '../star-rating.component';
import { ProductListResponse, ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { CurrencyPipe } from '@angular/common';
import { Product, ProductVariant } from '../../../models/product.model';
import { UtilityService } from '../../../services/utility.service';
import { ToastService } from '../../../services/toastr.service';

// import { SeoService } from '../../core/services/seo.service';


@Component({
  selector: 'storefront-product-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, StarRatingComponent],
  styles: [`.mobile-h-8rem {
  height: 130px;
}

@media (min-width: 640px) {
  .mobile-h-8rem {
    height: 80px; /* or another height */
  }
}`],
  template: `
    @if (product(); as p) {
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pt-16 xs:pt-16 xs:mt-6 lg:mt-12  ">

        <!-- Breadcrumb -->
        <nav class="text-xs sm:text-sm text-neutral-500 mb-4 flex gap-1.5 items-center overflow-x-auto whitespace-nowrap">
          <a routerLink="/" class="hover:text-neutral-900">Home</a>
          <span>/</span>
          <a [routerLink]="['/category', p.category]" class="hover:text-neutral-900">{{ p.category }}</a>
          <span>/</span>
          <span class="text-neutral-900 truncate">{{ p.name }}</span>
        </nav>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">

          <!-- Image gallery -->
          <div class="flex flex-col gap-3">
            <div class="relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden bg-neutral-100">
              <img
                [src]="activeImage()"
                [alt]="p.name"
                class="w-full h-full object-cover transition-opacity duration-300"
              />
              @if (p.compareAtPrice) {
                <span class="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Save {{ discountPercent(p) }}%
                </span>
              }
            </div>
            <!-- Thumbnails -->
            <div class="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
              @for (img of p.images; track img) {
                <button
                  (click)="activeImage.set(img)"
                  class="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors"
                  [class.border-neutral-900]="activeImage() === img"
                  [class.border-transparent]="activeImage() !== img"
                >
                  <img [src]="img" class="w-full h-full object-cover" [alt]="p.name" />
                </button>
              }
            </div>
          </div>

          <!-- Product info -->
          <div class="flex flex-col gap-4">
            <div>
              <p class="text-xs sm:text-sm font-medium text-neutral-500 uppercase tracking-wide">{{ p.brand }}</p>
              <h1 class="text-2xl sm:text-3xl font-semibold text-neutral-900 mt-1 leading-tight">{{ p.name }}</h1>
            </div>

            <div class="flex items-center gap-3">
              <app-star-rating [rating]="p.rating" [count]="p.reviewCount" size="md" />
              <span class="text-sm text-emerald-600 font-medium">{{ p.stock > 0 ? 'In stock' : 'Out of stock' }}</span>
              <span>{{selectedVariant()}}</span>
            </div>
          @if(selectedVariant()){


            <div class="flex items-baseline gap-3 py-2" >
              <span class="text-2xl sm:text-3xl font-semibold text-neutral-900">
                {{selectedVariant()?.price | currency:p.currency }}
              </span>
              @if (selectedVariant()?.compareAtPrice) {
                <span class="text-base sm:text-lg text-neutral-400 line-through">
                  {{ selectedVariant()?.compareAtPrice | currency:p.currency }}
                </span>
              }
            </div>
}
            <p class="text-sm sm:text-base text-neutral-600 leading-relaxed">{{ p.shortDescription }}</p>

            <!-- Color selector -->
            @if (p.variants.length) {
              <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-neutral-900">
                  Color: <span class="text-neutral-500 font-normal">{{ selectedVariant()?.color ?? '' }}</span>
                </span>
                <div class="flex gap-2">
                  @for (varzc of p.variants; track varzc.color) {
                    <button
                      (click)="onSelectVariant(varzc)"
                      class="w-9 h-9 rounded-full border-2 transition-all"
                      [class.border-neutral-900]="varzc.sku === selectedSku()"
                      [class.border-neutral-200]="varzc.sku != selectedSku()"
                      [style.backgroundColor]="varzc.color"
                      [attr.aria-label]="varzc.color"
                    ></button>
                  }
                </div>
              </div>
            }

            <!-- Size selector -->
            @if (p.variants.length) {
              <div class="flex flex-col gap-2">
                <span class="text-sm font-medium text-neutral-900">Size</span>
                <div class="flex flex-wrap gap-2">
                  @for (varz of p.variants; track varz.sku) {
                    <button
                      (click)="onSelectVariant(varz)"
                      class="min-w-[44px] h-10 px-3 rounded-lg border text-sm font-medium transition-colors"
                      [class.border-neutral-900]="varz.sku === selectedSku()"
                      [class.bg-neutral-900]="varz.sku === selectedSku()"
                      [class.text-white]="varz.sku === selectedSku()"
                      [class.border-neutral-300]="varz.sku != selectedSku()"
                      [class.text-neutral-700]="varz.sku != selectedSku()"
                    >
                      {{ varz.size }}
                      @if(varz.stock <= 0){
                        <span > (Out of Stock)</span>
                      }
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Quantity -->
            <div class="flex items-center gap-4">
              <span class="text-sm font-medium text-neutral-900">Quantity</span>
              <div class="flex items-center border border-neutral-300 rounded-lg">
                <button (click)="decrementQty()" class="w-10 h-10 flex items-center justify-center text-lg active:bg-neutral-100" aria-label="Decrease quantity">−</button>
                <span class="w-10 text-center text-sm font-medium">{{ quantity() }}</span>
                <button (click)="incrementQty()" class="w-10 h-10 flex items-center justify-center text-lg active:bg-neutral-100" aria-label="Increase quantity">+</button>
              </div>
            </div>

            <!-- CTA buttons - sticky on mobile -->
            <div class="flex flex-col sm:flex-row gap-3 mt-2 sticky bottom-0 bg-white py-3 sm:static sm:py-0 sm:bg-transparent mobile-h-8rem ">
              <button 
                (click)="addToCart()"
                [disabled]="isAddToCartDisabled()"
                class="flex-1 h-12 sm:h-13 rounded-xl bg-neutral-900 text-white font-semibold text-sm sm:text-base hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.992-4.51 2.466-6.39a.945.945 0 00-.928-1.149H5.106M7.5 14.25L5.106 5.272M6 18a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                Add to Cart
              </button>
              <button   [disabled]="isAddToCartDisabled()" (click)="buyNow()" class="h-12 sm:h-13 px-5 rounded-xl border border-neutral-300 font-semibold text-sm hover:bg-neutral-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                Buy Now
              </button>
            </div>

            <!-- Trust signals -->
            <div class="grid grid-cols-3 gap-2 pt-4 border-t border-neutral-200 mt-2">
              <div class="flex flex-col items-center text-center gap-1">
                <svg class="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>
                <span class="text-[11px] text-neutral-500">Free shipping</span>
              </div>
              <div class="flex flex-col items-center text-center gap-1">
                <svg class="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" /></svg>
                <span class="text-[11px] text-neutral-500">2-year warranty</span>
              </div>
              <div class="flex flex-col items-center text-center gap-1">
                <svg class="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286z" /></svg>
                <span class="text-[11px] text-neutral-500">Easy 30-day returns</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description / specs tabs -->
        <div class="mt-12 sm:mt-16 max-w-3xl">
          <h2 class="text-lg sm:text-xl font-semibold text-neutral-900 mb-3">Product Details</h2>
          <p class="text-sm sm:text-base text-neutral-600 leading-relaxed mb-4">{{ p.description }}</p>
          <ul class="space-y-2">
            @for (f of p.features; track f) {
              <li class="flex items-start gap-2 text-sm text-neutral-700">
                <svg class="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                {{ f }}
              </li>
            }
          </ul>
        </div>
      </section>
    }
  `,
})
export class StoreFrontProductDetailComponent implements OnInit, OnDestroy {

  private _uilityService = inject(UtilityService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private _cartService = inject(CartService);
  private router = inject(Router);
  // private seoService = inject(SeoService);
  readonly justAdded = signal<string | null>(null);
  isLoading: boolean = false;
  product = signal<Product>(this.route.snapshot.data['productDetail']);
  // Compute the default variant ONCE, directly from the resolved product —
  // no need for ngOnInit, since route data is already available synchronously.
  private defaultVariant = (() => {
    const product = this.product();
    console.log('product.variants.find(v => v.sku === product.defaultVariantSku)', product.variants.find(v => v.sku === product.defaultVariantSku))
    return product.variants.find(v => v.sku === product.defaultVariantSku)
      ?? product.variants[0];
  })();

  selectedSku = signal<string>(this.defaultVariant.sku);

  selectedVariant = computed<ProductVariant | undefined>(() =>
    this.product().variants.find(v => v.sku === this.selectedSku())
  );
  onSelectVariant(variant: ProductVariant) {
    this.selectedSku.set(variant.sku);
  }


  /*   sizes = computed<string[]>(() => [
      ...new Set(this.product().variants.map(v => v.size).filter(Boolean)),
    ] as string[]);
    colors = computed<string[]>(() => [
      ...new Set(this.product().variants.map(v => v.color).filter(Boolean)),
    ] as string[]); */


  isAddToCartDisabled = computed(() => {
    const variant = this.selectedVariant();
    return !variant || variant.stock <= 0;
  });

  addToCartLabel = computed(() => {
    const variant = this.selectedVariant();
    if (!variant) return 'Select options';
    if (variant.stock <= 0) return 'Out of Stock';
    return 'Add to Cart';
  });



  activeImage = signal<string>('');

  // selectedSize = signal<string>('');
  quantity = signal(1);

  ngOnInit() {

    this.activeImage.set(this.product().images[0]);
    // this.seoService.setProductSeo(product);
  }


  incrementQty() { this.quantity.update((q) => q + 1); }
  decrementQty() { this.quantity.update((q) => Math.max(1, q - 1)); }

  discountPercent(p: any) {
    return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
  }




  buyNow() {
    const variant = this.selectedVariant();
    if (!variant || variant.stock <= 0) return;
    const product = this.product();

    this._cartService.createBuyNowSession({
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

        this.isLoading = false;
        this.router.navigate(['/checkout'], { queryParams: { buyNow: res.sessionId } });
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong while quickAddApi');
        this.isLoading = false;
      },
    });
  }

  addToCart() {
    const variant = this.selectedVariant();
    if (!variant || variant.stock <= 0) return;
    const product = this.product();


    this.isLoading = true;
    this._cartService.addToCartAPI({
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

    this._cartService.getCartAPI().subscribe({
      next: (res: any) => {
        const cartMap = res.items.map((item: any) => ({
          ...item,
          priceAtPurchase: item.price, // or whatever value you want
        }));
        this._cartService.addManyToCart(cartMap ?? []);
        this.isLoading = false;
        this._cartService.open();
        // this.toast.showSuccess('Cart recievved successfully!');
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong while quickAddApi');
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy() {

  }

}

