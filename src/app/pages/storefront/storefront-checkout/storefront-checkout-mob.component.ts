import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../services/cart.service';

type Step = 'contact' | 'address' | 'delivery' | 'payment';

@Component({
  selector: 'app-mobile-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 class="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-6">Checkout</h1>

      <div class="flex flex-col gap-3">
        <!-- STEP 1: Contact -->
        <div class="border border-neutral-200 rounded-2xl overflow-hidden">
          <button
            class="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
            (click)="openStep.set('contact')"
          >
            <span class="flex items-center gap-3">
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                [class.bg-rose-600]="isDone('contact')"
                [class.text-white]="isDone('contact')"
                [class.bg-neutral-100]="!isDone('contact')"
                [class.text-neutral-500]="!isDone('contact')"
              >
                @if (isDone('contact')) { ✓ } @else { 1 }
              </span>
              <span class="font-medium text-neutral-900">Contact details</span>
            </span>
            @if (isDone('contact') && openStep() !== 'contact') {
              <span class="text-sm text-neutral-500">{{ contact.email }}</span>
            }
          </button>

          @if (openStep() === 'contact') {
            <div class="px-4 sm:px-5 pb-5 flex flex-col gap-3">
              <!-- Guest vs login -->
              @if (!loggedIn()) {
                <div class="flex gap-2 mb-1">
                  <button
                    (click)="authMode.set('guest')"
                    class="flex-1 py-2 rounded-full text-sm font-semibold border"
                    [class.bg-rose-600]="authMode() === 'guest'"
                    [class.text-white]="authMode() === 'guest'"
                    [class.border-rose-600]="authMode() === 'guest'"
                    [class.border-neutral-300]="authMode() !== 'guest'"
                    [class.text-neutral-700]="authMode() !== 'guest'"
                  >
                    Continue as Guest
                  </button>
                  <button
                    (click)="authMode.set('login')"
                    class="flex-1 py-2 rounded-full text-sm font-semibold border"
                    [class.bg-rose-600]="authMode() === 'login'"
                    [class.text-white]="authMode() === 'login'"
                    [class.border-rose-600]="authMode() === 'login'"
                    [class.border-neutral-300]="authMode() !== 'login'"
                    [class.text-neutral-700]="authMode() !== 'login'"
                  >
                    Login
                  </button>
                </div>
              }

              @if (authMode() === 'login' && !loggedIn()) {
                <input
                  type="tel"
                  placeholder="Mobile number"
                  [(ngModel)]="loginMobile"
                  class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
                />
                <button
                  (click)="sendOtp()"
                  class="text-sm font-semibold text-rose-600 self-start"
                >
                  Send OTP →
                </button>
              } @else {
                <input
                  type="email"
                  placeholder="Email address"
                  [(ngModel)]="contact.email"
                  class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
                />
                <input
                  type="tel"
                  placeholder="Mobile number (for delivery updates)"
                  [(ngModel)]="contact.phone"
                  class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm"
                />
                <button
                  (click)="completeStep('contact', 'address')"
                  [disabled]="!contact.email || !contact.phone"
                  class="self-end mt-1 px-5 py-2.5 rounded-full bg-rose-600 text-white text-sm font-semibold disabled:opacity-40"
                >
                  Continue to address
                </button>
              }
            </div>
          }
        </div>

        <!-- STEP 2: Address -->
        <div class="border border-neutral-200 rounded-2xl overflow-hidden" [class.opacity-50]="!isDone('contact')">
          <button
            class="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left disabled:cursor-not-allowed"
            [disabled]="!isDone('contact')"
            (click)="openStep.set('address')"
          >
            <span class="flex items-center gap-3">
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                [class.bg-rose-600]="isDone('address')"
                [class.text-white]="isDone('address')"
                [class.bg-neutral-100]="!isDone('address')"
                [class.text-neutral-500]="!isDone('address')"
              >
                @if (isDone('address')) { ✓ } @else { 2 }
              </span>
              <span class="font-medium text-neutral-900">Shipping address</span>
            </span>
            @if (isDone('address') && openStep() !== 'address') {
              <span class="text-sm text-neutral-500 truncate max-w-[55%]">{{ address.line1 }}, {{ address.pincode }}</span>
            }
          </button>

          @if (openStep() === 'address') {
            <div class="px-4 sm:px-5 pb-5 flex flex-col gap-3">
              <input placeholder="Full name" [(ngModel)]="address.name" class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm" />
              <input placeholder="Flat / House no., Building, Street" [(ngModel)]="address.line1" class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm" />
              <input placeholder="Landmark (optional)" [(ngModel)]="address.line2" class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm" />
              <div class="grid grid-cols-2 gap-3">
                <input placeholder="City" [(ngModel)]="address.city" class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm" />
                <input placeholder="Pincode" [(ngModel)]="address.pincode" (blur)="checkServiceability()" class="border border-neutral-300 rounded-lg px-3 py-2.5 text-sm" />
              </div>
              @if (serviceable() === false) {
                <p class="text-xs text-rose-600">We currently don't deliver to this pincode.</p>
              }
              <label class="flex items-center gap-2 text-xs text-neutral-500">
                <input type="checkbox" [(ngModel)]="address.discreetPackaging" class="rounded border-neutral-300 text-rose-600" />
                Ship in plain, unbranded packaging
              </label>
              <button
                (click)="completeStep('address', 'delivery')"
                [disabled]="!address.line1 || !address.pincode || serviceable() === false"
                class="self-end mt-1 px-5 py-2.5 rounded-full bg-rose-600 text-white text-sm font-semibold disabled:opacity-40"
              >
                Continue to delivery
              </button>
            </div>
          }
        </div>

        <!-- STEP 3: Delivery -->
        <div class="border border-neutral-200 rounded-2xl overflow-hidden" [class.opacity-50]="!isDone('address')">
          <button
            class="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
            [disabled]="!isDone('address')"
            (click)="openStep.set('delivery')"
          >
            <span class="flex items-center gap-3">
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                [class.bg-rose-600]="isDone('delivery')"
                [class.text-white]="isDone('delivery')"
                [class.bg-neutral-100]="!isDone('delivery')"
                [class.text-neutral-500]="!isDone('delivery')"
              >
                @if (isDone('delivery')) { ✓ } @else { 3 }
              </span>
              <span class="font-medium text-neutral-900">Delivery method</span>
            </span>
          </button>

          @if (openStep() === 'delivery') {
            <div class="px-4 sm:px-5 pb-5 flex flex-col gap-2">
              @for (opt of deliveryOptions; track opt.id) {
                <label
                  class="flex items-center justify-between border rounded-xl px-3 py-3 cursor-pointer"
                  [class.border-rose-600]="deliveryMethod === opt.id"
                  [class.border-neutral-200]="deliveryMethod !== opt.id"
                >
                  <span class="flex items-center gap-2">
                    <input type="radio" name="delivery" [value]="opt.id" [(ngModel)]="deliveryMethod" class="text-rose-600" />
                    <span class="text-sm">
                      <span class="font-medium text-neutral-900 block">{{ opt.label }}</span>
                      <span class="text-neutral-500">{{ opt.eta }}</span>
                    </span>
                  </span>
                  <span class="text-sm font-semibold">{{ opt.price === 0 ? 'Free' : (opt.price | currency: 'INR') }}</span>
                </label>
              }
              <button
                (click)="completeStep('delivery', 'payment')"
                class="self-end mt-1 px-5 py-2.5 rounded-full bg-rose-600 text-white text-sm font-semibold"
              >
                Continue to payment
              </button>
            </div>
          }
        </div>

        <!-- STEP 4: Payment -->
        <div class="border border-neutral-200 rounded-2xl overflow-hidden" [class.opacity-50]="!isDone('delivery')">
          <button
            class="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
            [disabled]="!isDone('delivery')"
            (click)="openStep.set('payment')"
          >
            <span class="flex items-center gap-3">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold bg-neutral-100 text-neutral-500">4</span>
              <span class="font-medium text-neutral-900">Payment</span>
            </span>
          </button>

          @if (openStep() === 'payment') {
            <div class="px-4 sm:px-5 pb-5 flex flex-col gap-2">
              @for (method of paymentMethods; track method.id) {
                <label
                  class="flex items-center gap-2 border rounded-xl px-3 py-3 cursor-pointer text-sm font-medium"
                  [class.border-rose-600]="paymentMethod === method.id"
                  [class.border-neutral-200]="paymentMethod !== method.id"
                >
                  <input type="radio" name="payment" [value]="method.id" [(ngModel)]="paymentMethod" class="text-rose-600" />
                  {{ method.label }}
                </label>
              }
              <button
                (click)="placeOrder()"
                class="mt-2 py-3.5 rounded-full bg-rose-600 text-white font-semibold active:scale-[0.98] transition-transform"
              >
                Pay {{ cart.finalPrice() | currency: 'INR' }}
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Order summary -->
      <div class="mt-6 border border-neutral-200 rounded-2xl px-4 sm:px-5 py-4 flex items-center justify-between">
        <span class="text-sm text-neutral-600">{{ cart.totalItems() }} items</span>
        <span class="text-base font-semibold text-neutral-900">{{ cart.finalPrice() | currency: 'INR' }}</span>
      </div>
    </section>
  `,
})
export class MobileCheckoutComponent {
  readonly cart = inject(CartService);

  readonly openStep = signal<Step>('contact');
  private readonly doneSteps = signal<Set<Step>>(new Set());

  readonly loggedIn = signal(false);
  authMode = signal<'guest' | 'login'>('guest');
  loginMobile = '';

  contact = { email: '', phone: '' };
  address = { name: '', line1: '', line2: '', city: '', pincode: '', discreetPackaging: true };
  readonly serviceable = signal<boolean | null>(null);

  deliveryMethod: 'standard' | 'express' = 'standard';
  readonly deliveryOptions = [
    { id: 'standard' as const, label: 'Standard delivery', eta: '4-6 business days', price: 0 },
    { id: 'express' as const, label: 'Express delivery', eta: '1-2 business days', price: 99 },
  ];

  paymentMethod: 'upi' | 'card' | 'cod' = 'upi';
  readonly paymentMethods = [
    { id: 'upi' as const, label: 'UPI' },
    { id: 'card' as const, label: 'Credit / Debit card' },
    { id: 'cod' as const, label: 'Cash on delivery' },
  ];

  isDone(step: Step) {
    return this.doneSteps().has(step);
  }

  completeStep(step: Step, next: Step) {
    this.doneSteps.update((s) => new Set(s).add(step));
    this.openStep.set(next);
  }

  sendOtp() {
    // wire up to your auth API; on success:
    this.loggedIn.set(true);
    this.completeStep('contact', 'address');
  }

  checkServiceability() {
    // replace with a real pincode-serviceability API call
    this.serviceable.set(this.address.pincode.length === 6);
  }

  placeOrder() {
    // wire up to your payment gateway (Razorpay/Stripe/PayU) here,
    // passing cart.finalPrice(), address, and contact
    console.log('Placing order', {
      contact: this.contact,
      address: this.address,
      deliveryMethod: this.deliveryMethod,
      paymentMethod: this.paymentMethod,
      total: this.cart.finalPrice(),
    });
  }
}
