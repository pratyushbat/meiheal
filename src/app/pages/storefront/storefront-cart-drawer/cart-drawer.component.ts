import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { Component, effect, ElementRef, inject, OnInit, PLATFORM_ID, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../../../services/cart.service';
import { UpsellProduct } from '../../../models/product.model';
import { ToastService } from '../../../services/toastr.service';


@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    @if (cart.isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] animate-[fadeIn_.2s_ease]"
        (click)="cart.close()"
      ></div>

      <!-- Drawer: full-screen on mobile, right-side panel on desktop -->
      <aside
        class="fixed inset-y-0 right-0 z-[999] flex flex-col bg-white shadow-2xl
               w-full sm:w-[420px] h-[100dvh]
               translate-x-0 transition-transform duration-300 ease-out "
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <!-- Header -->
        <div class="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-neutral-100">
          <h2 class="text-base sm:text-lg font-semibold text-neutral-900">
            Cart <span class="text-neutral-400 font-normal">{{ cart.totalItems() }}</span>
          </h2>
          <button
            (click)="cart.close()"
            aria-label="Close cart"
            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 active:scale-90 transition-transform"
          >
            <svg class="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Discreet shipping marquee -->
        <div class="flex-shrink-0 overflow-hidden bg-rose-600 py-1.5">
          <div class="flex whitespace-nowrap animate-[marquee_14s_linear_infinite]">
            @for (i of [1,2,3,4,5,6]; track i) {
              <span class="mx-4 text-[11px] sm:text-xs font-bold tracking-wide text-white uppercase">
                Fast &amp; discreet shipping
              </span>
            }
          </div>
        </div>

        <!-- Scrollable body -->
         <!-- min-h-0 added -->
        <div class="min-h-0 flex-1 overflow-y-auto">
          @if (cart.isEmpty()) {
            <div class="flex flex-col items-center justify-center gap-3 py-20 px-6 text-center">
              <svg class="w-12 h-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.99-4.694 2.6-7.152.084-.337-.17-.66-.516-.66H5.106M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              <p class="text-neutral-500 text-sm">Your cart is empty.</p>
              <button
                (click)="cart.close()"
                class="mt-1 text-sm font-semibold text-rose-600 hover:text-rose-700"
              >
                Continue shopping
              </button>
            </div>
          } @else {
            <!-- Line items -->
            <div class="px-4 sm:px-5 divide-y divide-neutral-100">
              @for (item of cart.items(); track item.sku) {
                <div class="flex gap-3 py-4">
                  <img
                    [src]="item.thumbnail"
                    [alt]="item.name"
                    class="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover bg-neutral-100 shrink-0"
                  />
                  <div class="flex-1 flex flex-col gap-1 min-w-0">
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        @if (item.rating) {
                          <div class="flex items-center gap-1 text-amber-500 text-xs">
                            <span>★</span>
                            <span class="text-neutral-400">{{ item.reviewCount }} reviews</span>
                          </div>
                        }
                        <p class="text-sm font-medium text-neutral-900 truncate">{{ item.name }}</p>
                      </div>
                      <span class="text-sm font-semibold text-neutral-900 shrink-0">
                        {{ item.price | currency: item.currency }}
                      </span>
                    </div>

                    <div class="flex items-center justify-between mt-auto pt-1">
                      <!-- Qty stepper -->
                      <div class="flex items-center gap-3 border border-neutral-200 rounded-full px-1">
                        <button
                          (click)="cart.updateQty(item, -1)"
                          class="w-6 h-6 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform"
                          aria-label="Decrease quantity"
                        >−</button>
                        <span class="text-sm font-medium w-4 text-center">{{ item.qty }}</span>
                        <button
                          (click)="cart.updateQty(item, 1)"
                          class="w-6 h-6 flex items-center justify-center text-neutral-600 active:scale-90 transition-transform"
                          aria-label="Increase quantity"
                        >+</button>
                      </div>

                      <button
                        (click)="cart.removeItem(item)"
                        aria-label="Remove item"
                        class="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-rose-600 active:scale-90 transition-transform"
                      >
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m2 0v13a2 2 0 01-2 2H9a2 2 0 01-2-2V7h10z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Upsell rail -->
            @if (cart.upsells().length) {
              <div class="px-4 sm:px-5 pb-5">
                <div class="flex items-center justify-between mb-2">
                  <p class="text-sm font-medium text-neutral-800">Make your intimate moments even hotter ;)</p>
                  <div class="flex gap-1">
                    <button
                      (click)="scrollUpsell(-1)"
                      class="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center active:scale-90 transition-transform"
                      aria-label="Scroll left"
                    >←</button>
                    <button
                      (click)="scrollUpsell(1)"
                      class="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center active:scale-90 transition-transform"
                      aria-label="Scroll right"
                    >→</button>
                  </div>
                </div>

                <div
                  #upsellTrack
                  class="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                  data-upsell-track
                >
                  @for (p of cart.upsells(); track p.id) {
                    <div class="snap-start shrink-0 w-32 border border-neutral-200 rounded-xl p-2 flex flex-col gap-1">
                      <img [src]="p.thumbnail" [alt]="p.name" class="w-full aspect-square object-cover rounded-lg bg-neutral-100" />
                      <p class="text-xs font-medium text-neutral-900 line-clamp-2 leading-snug">{{ p.name }}</p>
                      <div class="flex items-center gap-1 text-[11px] text-amber-500">
                        <span>★</span><span class="text-neutral-400">{{ p.rating }}</span>
                      </div>
                      <p class="text-xs font-semibold text-neutral-900">{{ p.price | currency: p.currency }}</p>
                      <button
                        (click)="addUpsell(p)"
                        class="mt-1 text-xs font-semibold text-rose-600 border border-rose-200 rounded-full py-1 hover:bg-rose-50 active:scale-95 transition-transform"
                      >
                        Add
                      </button>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>

        <!-- Sticky footer -->
        @if (!cart.isEmpty()) {
          <div class="border-t border-neutral-100 px-4 sm:px-5 py-4 bg-white">
            <div class="flex items-center justify-between mb-3">
              <span class="text-sm font-medium text-neutral-600">Final Price</span>
              <span class="text-lg font-semibold text-neutral-900">
                {{ cart.finalPrice() | currency: 'INR' }}
              </span>
            </div>

            <button
              (click)="goToCheckout()"
              [disabled]="!ageConfirmed()"
              class="w-full py-3.5 rounded-full font-semibold text-white bg-rose-600 hover:bg-rose-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     active:scale-[0.98] transition-transform"
            >
              Checkout — {{ cart.finalPrice() | currency: 'INR' }}
            </button>
<!-- 
            <label class="flex items-center gap-2 mt-3 text-xs text-neutral-500 cursor-pointer">
              <input
                type="checkbox"
                [checked]="ageConfirmed()"
                (change)="ageConfirmed.set(!ageConfirmed())"
                class="w-4 h-4 rounded border-neutral-300 text-rose-600 focus:ring-rose-500"
              />
              You are 21+ and agree to the T&amp;C
            </label> -->
          </div>
        }
      </aside>
    }
  `,
  styles: [`
    @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    @keyframes marquee {
      from { transform: translateX(0) }
      to { transform: translateX(-50%) }
    }
  `]
})
export class CartDrawerComponent implements OnInit {
  readonly cart = inject(CartService);
  readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  readonly ageConfirmed = signal(true); // default true; set false if you need explicit opt-in
  private readonly upsellTrack = viewChild<ElementRef<HTMLElement>>('upsellTrack');
  isLoading: boolean = false;
  private toast = inject(ToastService);
  items = [];

  constructor() {
    effect(() => {
      if (isPlatformBrowser(this.platformId))
        document.body.style.overflow = this.cart.isOpen() ? 'hidden' : '';
    });
    console.log(this.cart.items())
  }
  ngOnInit(): void {

    if (isPlatformBrowser(this.platformId)) {
      this.getCartApi();
    }
  }

  getCartApi() {

    this.cart.getCartAPI().subscribe({
      next: (res: any) => {
        const cartMap = res.items.map((item: any) => ({
          ...item,
          priceAtPurchase: item.price, // or whatever value you want
        }));
        this.cart.addManyToCart(cartMap ?? []);
        this.isLoading = false;
        this.items = res.items;
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong while quickAddApi');
        this.isLoading = false;
      },
    });
  }

  addUpsell(p: UpsellProduct) {
    this.cart.addToCart(
      {
        id: p.id,
        slug: p.id,
        name: p.name,
        brand: '',
        thumbnail: p.thumbnail,
        images: [p.thumbnail],
        price: p.price,
        currency: p.currency,
        rating: p.rating,
        reviewCount: 0,
        stock: 99,          // upsell rail assumes in-stock; swap for real stock if you have it
        category: '',
        sku: p.id,
        maxPrice: p.price,
        features: [],
        isActive: true,
        tags: [],
        variants: [],

      },
      1,
      false // don't reopen — drawer's already open
    );
  }

  scrollUpsell(direction: 1 | -1) {
    this.upsellTrack()?.nativeElement.scrollBy({ left: direction * 140, behavior: 'smooth' });
  }

  goToCheckout() {
    console.log(this.cart.items())
    this.cart.close();
    this.router.navigate(['/checkout']);
  }
}
