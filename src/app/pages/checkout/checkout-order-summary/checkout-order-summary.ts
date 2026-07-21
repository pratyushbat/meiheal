import { Component, computed, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartItemN } from '../../../models/product.model';
import { CartService } from '../../../services/cart.service';

export type BillingInterval = 'weekly' | 'monthly' | 'quarterly';

// export interface OrderSummaryItem {
//   id: string;
//   name: string;
//   thumbnail: string;
//   qty: number;
//   price: number;
//   type?: 'product' | 'subscription'; // defaults to 'product' if omitted
//   billingInterval?: BillingInterval; // only meaningful when type === 'subscription'
// }

const INTERVAL_LABEL: Record<BillingInterval, string> = {
  weekly: 'week',
  monthly: 'month',
  quarterly: '3 months',
};

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sticky top-4 flex flex-col gap-3">

      <div class="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5">
        <p class="text-sm font-semibold text-neutral-900 mb-4">
          Order summary
          <span class="font-normal text-neutral-400">
            ({{ totalItemCount() }} {{ totalItemCount() === 1 ? 'item' : 'items' }})
          </span>
        </p>

        <div class="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">

          <!-- One-time products -->
          @if (oneTimeItems().length > 0) {
            <div class="flex flex-col gap-3">
              @if (subscriptionItems().length > 0) {
                <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">One-time</p>
              }
              @for (item of oneTimeItems(); track item._id) {
                <div class="flex gap-3 items-start">
                  <div class="relative w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                    <img [src]="item.thumbnail" [alt]="item.name" class="w-full h-full object-cover" />
                    @if (item.qty > 1) {
                      <span class="absolute -top-1.5 -right-1.5 bg-neutral-900 text-white text-[10px] font-semibold w-4 h-4 rounded-full flex items-center justify-center">
                        {{ item.qty }}
                      </span>
                    }
                  </div>
                  <p class="flex-1 text-xs sm:text-sm text-neutral-700 leading-snug line-clamp-2">
                    {{ item.name }}
                  </p>
                  <p class="text-xs sm:text-sm font-medium text-neutral-900 whitespace-nowrap">
                   {{ (item.priceAtPurchase * item.qty) | currency: currency() }}
                  </p>
                </div>
              }
            </div>
          }

          <!-- Subscriptions - visually separated since they carry a recurring charge -->
          @if (subscriptionItems().length > 0) {
            <div class="flex flex-col gap-3">
              @if (oneTimeItems().length > 0) {
                <p class="text-[11px] font-medium uppercase tracking-wide text-neutral-400">Subscription</p>
              }
              @for (item of subscriptionItems(); track item._id) {
                <div class="flex gap-3 items-start">
                  <div class="relative w-12 h-12 rounded-lg bg-neutral-100 overflow-hidden flex-shrink-0">
                    <img [src]="item.thumbnail" [alt]="item.name" class="w-full h-full object-cover" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs sm:text-sm text-neutral-700 leading-snug line-clamp-2">
                      {{ item.name }}
                    </p>
                <!--     <span class="inline-block mt-1 text-[10px] font-medium text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                      Billed every {{ intervalLabel(item.billingInterval) }}
                    </span> -->
                  </div>
                  <p class="text-xs sm:text-sm font-medium text-neutral-900 whitespace-nowrap">
                    {{ item.priceAtPurchase | currency: currency() }}
                  </p>
                </div>
              }
            </div>
          }

          @if (totalItemCount() === 0) {
            <p class="text-sm text-neutral-400 text-center py-4">Your cart is empty</p>
          }
        </div>

        <!-- Promo code - collapsed by default, doesn't add visual weight for people without one -->
        @if (totalItemCount() > 0) {
          <div class="mt-4 pt-4 border-t border-neutral-100">
            @if (!promoOpen()) {
              <button
                type="button"
                (click)="promoOpen.set(true)"
                class="text-xs sm:text-sm text-rose-600 font-medium"
              >
                Have a promo code?
              </button>
            } @else {
              <div class="flex gap-2">
                <input
                  type="text"
                  [(ngModel)]="promoCode"
                  placeholder="Enter code"
                  class="flex-1 text-sm border border-neutral-300 rounded-lg px-3 py-2"
                />
                <button
                  type="button"
                  (click)="applyPromo.emit(promoCode())"
                  class="text-sm font-medium text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2"
                >
                  Apply
                </button>
              </div>
            }
          </div>
        }

        @if (totalItemCount() > 0) {
          <div class="mt-4 pt-4 border-t border-neutral-100 flex flex-col gap-2">
            <div class="flex justify-between text-sm text-neutral-600">
              <span>Subtotal</span>
              <span>{{ subtotal() | currency: currency() }}</span>
            </div>
            <div class="flex justify-between text-sm text-neutral-600">
              <span>Shipping</span>
              @if (shipping() === 0) {
                <span class="text-green-700 font-medium">Free</span>
              } @else {
                <span>{{ shipping() | currency: currency() }}</span>
              }
            </div>
            @if (discount() > 0) {
              <div class="flex justify-between text-sm text-rose-600">
                <span>Discount</span>
                <span>-{{ discount() | currency: currency() }}</span>
              </div>
            }
            <div class="flex justify-between text-base font-semibold text-neutral-900 pt-2 mt-1 border-t border-neutral-100">
              <span>Due today</span>
              <!-- <span>{{ total() | currency: currency() }}</span> -->
              {{ finalPrice() | currency: 'INR' }}
            </div>

            <!-- Recurring note - makes clear the subscription portion repeats after today -->
            @if (subscriptionItems().length > 0) {
              <p class="text-xs text-neutral-400 pt-1">
           <!--      @for (item of subscriptionItems(); track item.id; let last = $last) {
                  then {{ item.priceAtPurchase | currency: currency() }} every {{ intervalLabel(item.billingInterval) }}{{ last ? '' : ', ' }}
                } -->
              </p>
            }
          </div>
        }
      </div>

      <div class="flex items-center justify-center gap-1.5 text-xs text-neutral-400 py-1">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
        Secure checkout
      </div>

    </div>
  `
})
export class CheckoutOrderSummaryComponent {
  readonly finalPrice = computed(() => {
    console.log('CheckoutOrderSummaryComponent this.items()', this.items())
    return this.items().reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0)
  }
  );
  constructor() {
    // console.log(this._cartService.items())
  }
  // _cartService = inject(CartService)
  items = input.required<CartItemN[]>();
  shipping = input<number>(0);
  discount = input<number>(0);
  currency = input<string>('INR');

  promoOpen = signal(false);
  promoCode = signal('');

  applyPromo = output<string>();

  oneTimeItems = computed(() =>
    this.items().filter(i => (i.type ?? 'product') === 'product')
  );

  subscriptionItems = computed(() =>
    this.items().filter(i => i.type === 'subscription')
  );

  totalItemCount = computed(() =>
    this.oneTimeItems().reduce((sum, i) => sum + i.qty, 0) + this.subscriptionItems().length
  );

  // Subtotal = one-time items (qty-aware) + first-period price of every subscription.
  // The subscription's own price already represents one billing cycle, so qty doesn't apply to it.
  subtotal = computed(() =>
    this.oneTimeItems().reduce((sum, i) => sum + i.priceAtPurchase * i.qty, 0) +
    this.subscriptionItems().reduce((sum, i) => sum + i.priceAtPurchase, 0)
  );

  total = computed(() =>
    this.subtotal() + this.shipping() - this.discount()
  );

  intervalLabel(interval?: BillingInterval): string {
    return interval ? INTERVAL_LABEL[interval] : 'cycle';
  }
}
