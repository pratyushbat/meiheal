import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  PLATFORM_ID,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  filter,
  tap,
  catchError,
  of,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';

import { CheckoutOrderSummaryComponent } from '../checkout-order-summary/checkout-order-summary';
import { AddressService } from '../../../services/address.service';
import { Address } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { CheckOutService, PincodeResponse } from '../../../services/checkout.service';
import { AlertService } from '../../../services/alert.service';
import { environment } from '../../../../environments/environment';
import { ToastService } from '../../../services/toastr.service';
import { CartService } from '../../../services/cart.service';
import { CartItemN } from '../../../models/product.model';



type CheckoutStep = 'contact' | 'shipping' | 'delivery' | 'payment';

interface StepperNode {
  id: 'information' | 'delivery' | 'payment';
  label: string;
  matches: CheckoutStep[];
}


interface PostOfficeLookup {
  name: string;
  block: string;
  state: string;
}

declare var Razorpay: any;
@Component({
  selector: 'app-checkout-old',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CheckoutOrderSummaryComponent],
  template: `
   <section class="max-w-7xl mx-auto px-4 sm:px-6 sm:py-12">
  <div class="flex items-center justify-between mb-6">
    <h1 class="text-2xl sm:text-3xl font-semibold text-neutral-900">Checkout</h1>
    @if (!isLoggedIn()) {
      <a
        routerLink="/login"
        class="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded-full px-4 py-1.5 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
      >
        <svg
          class="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l3 3m0 0l-3 3m3-3H3"
          />
        </svg>
        Log in
      </a>
    }
  </div>

  <!-- Overview stepper -->
  <nav aria-label="Checkout progress" class="mb-8">
    <ol class="flex items-center">
      @for (node of stepperNodes; track node.id; let last = $last; let i = $index) {
        <li class="flex items-center" [class.flex-1]="!last">
          <button
            type="button"
            [disabled]="!canJumpToNode(node)"
            (click)="jumpToNode(node)"
            class="flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <span
              class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-colors"
              [class.bg-rose-600]="isNodeActive(node) || isNodeDone(node)"
              [class.text-white]="isNodeActive(node) || isNodeDone(node)"
              [class.bg-neutral-200]="!isNodeActive(node) && !isNodeDone(node)"
              [class.text-neutral-500]="!isNodeActive(node) && !isNodeDone(node)"
            >
              @if (isNodeDone(node) && !isNodeActive(node)) {
                <svg
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              } @else {
                {{ i + 1 }}
              }
            </span>
            <span
              class="text-sm font-medium"
              [class.text-neutral-900]="isNodeActive(node)"
              [class.text-neutral-500]="!isNodeActive(node)"
              >{{ node.label }}</span
            >
          </button>

          @if (!last) {
            <span
              class="flex-1 h-0.5 mx-3"
              [class.bg-rose-600]="isNodeDone(node)"
              [class.bg-neutral-200]="!isNodeDone(node)"
            ></span>
          }
        </li>
      }
    </ol>
  </nav>

  <div class="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6">
    <!-- Left: accordion steps -->
    <div class="flex flex-col gap-4">
      <!-- Step 1: Contact -->
      <div class="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
        <button
          type="button"
          (click)="setActiveStep('contact')"
          class="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left"
        >
          <div class="flex items-center gap-3">
            @if (isStepDone('contact')) {
              <span
                class="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center flex-shrink-0"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            } @else {
              <span
                class="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 text-xs font-medium flex items-center justify-center flex-shrink-0"
                >1</span
              >
            }
            <span class="text-sm sm:text-base font-medium text-neutral-900">Contact details</span>
          </div>
          @if (isStepDone('contact') && activeStep() !== 'contact') {
            <span class="text-sm text-neutral-500">{{
              checkoutForm.controls.contact.controls.email.value
            }}</span>
          }
        </button>

        @if (activeStep() === 'contact') {
          <div
            class="px-4 sm:px-5 pb-5 flex flex-col gap-3"
            [formGroup]="checkoutForm.controls.contact"
          >
            @if (!isLoggedIn()) {
              <button
                type="button"
                (click)="loginWithGoogle()"
                class="w-full flex items-center justify-center gap-2 border border-neutral-300 rounded-lg py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47c-.28 1.5-1.13 2.77-2.4 3.62v3h3.88c2.27-2.09 3.57-5.17 3.57-8.65z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09C3.26 21.3 7.3 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.31 14.32A7.19 7.19 0 0 1 4.9 12c0-.8.14-1.58.38-2.32V6.59H1.3A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.3 5.41l4.01-3.09z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0 7.3 0 3.26 2.7 1.3 6.59l4.01 3.09C6.25 6.86 8.89 4.75 12 4.75z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div class="flex items-center gap-3">
                <span class="flex-1 h-px bg-neutral-200"></span>
                <span class="text-xs text-neutral-400">or checkout as guest</span>
                <span class="flex-1 h-px bg-neutral-200"></span>
              </div>
            }

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                formControlName="email"
                placeholder="name@email.com"
                class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5"
              />
              <input
                type="tel"
                formControlName="phone"
                placeholder="98765 43210"
                class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5"
              />
            </div>

            @if (!isLoggedIn()) {
              <label class="flex items-center gap-2 text-sm text-neutral-600">
                <input
                  type="checkbox"
                  [checked]="saveInfoForNextTime()"
                  (change)="saveInfoForNextTime.set(!saveInfoForNextTime())"
                  class="rounded border-neutral-300"
                />
                Save my info for faster checkout next time
              </label>
            }

            <button
              type="button"
              [disabled]="!isContactValid()"
              (click)="completeStep('contact', 'shipping')"
              class="self-end mt-1 bg-rose-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              Continue to shipping
            </button>
          </div>
        }
      </div>

      <!-- Step 2: Shipping -->
      <div
        class="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
        [class.opacity-50]="!isStepDone('contact')"
      >
        <button
          type="button"
          [disabled]="!isStepDone('contact')"
          (click)="setActiveStep('shipping')"
          class="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
        >
          @if (isStepDone('shipping')) {
            <span
              class="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center flex-shrink-0"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          } @else {
            <span
              class="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 text-xs font-medium flex items-center justify-center flex-shrink-0"
              >2</span
            >
          }
          <span class="text-sm sm:text-base font-medium text-neutral-900">Shipping address</span>
        </button>

        @if (activeStep() === 'shipping') {
          <div class="px-4 sm:px-5 pb-5 flex flex-col gap-3">
            <!-- Saved addresses -->
            @if (isLoggedIn() && savedAddresses().length > 0) {
              <div class="flex flex-col gap-2">
                @for (addr of savedAddresses(); track addr._id) {
                  <label
                    class="flex items-start gap-3 border rounded-xl px-4 py-3 cursor-pointer"
                    [class.border-rose-600]="
                      addressMode() === 'saved' && selectedAddressId() === addr._id
                    "
                    [class.border-neutral-200]="
                      !(addressMode() === 'saved' && selectedAddressId() === addr._id)
                    "
                  >
                    <input
                      type="radio"
                      name="savedAddress"
                      class="mt-1 accent-rose-600"
                      [checked]="addressMode() === 'saved' && selectedAddressId() === addr._id"
                      (change)="selectSavedAddress(addr)"
                    />
                    <span class="text-sm">
                      <span class="block font-medium text-neutral-900"
                        >{{ addr.fullName }} {{ addr.isDefault ? '(Default)' : '' }}</span
                      >
                      <span class="block text-neutral-500"
                        >{{ addr.address }}{{ addr.landmark ? ', ' + addr.landmark : '' }}</span
                      >
                      <span class="block text-neutral-500"
                        >{{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</span
                      >
                    </span>
                  </label>
                }
                <button
                  type="button"
                  (click)="startNewAddress()"
                  class="self-start text-sm font-medium text-rose-600 mt-1"
                >
                  + Use a different address
                </button>
              </div>
            }

            <!-- New address form -->
            @if (addressMode() === 'new') {
              <div class="flex flex-col gap-3" [formGroup]="checkoutForm.controls.shipping">
                <input
                  type="text"
                  formControlName="fullName"
                  placeholder="Full name"
                  class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full"
                />

                <input
                  type="text"
                  formControlName="address"
                  placeholder="Flat / house no., building, street"
                  class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full"
                />
                <input
                  type="text"
                  formControlName="landmark"
                  placeholder="Landmark / area (optional)"
                  class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full"
                />

                <input
                  type="text"
                  formControlName="pincode"
                  maxlength="6"
                  placeholder="Pincode"
                  class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5"
                />

                @if (postOfficeOptions().length > 1) {
                  <select
                    formControlName="locality"
                    (change)="onPostOfficeSelect($any($event.target).value)"
                    class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 bg-white"
                  >
                    @for (po of postOfficeOptions(); track po.name) {
                      <option [value]="po.name">{{ po.name }}</option>
                    }
                  </select>
                }

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    formControlName="city"
                    [readonly]="pincodeLookupDone()"
                    placeholder="City"
                    class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5"
                    [class.bg-neutral-50]="pincodeLookupDone()"
                  />
                  <select
                    formControlName="state"
                    class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 bg-white disabled:bg-neutral-50 disabled:text-neutral-500"
                  >
                    <option value="" disabled>State</option>
                    @for (s of indianStates; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>

                @if (pincodeStatus() === 'checking') {
                  <p class="text-xs text-neutral-400">Checking delivery availability...</p>
                }
                @if (pincodeStatus() === 'unserviceable') {
                  <p class="text-xs text-rose-600 font-medium">
                    We currently don't deliver to this pincode.
                  </p>
                }
                @if (pincodeStatus() === 'serviceable') {
                  <p class="text-xs text-green-700 font-medium">
                    Delivers to {{ checkoutForm.controls.shipping.controls.city.value }},
                    {{ checkoutForm.controls.shipping.controls.state.value }}
                  </p>
                }
              </div>

              @if (isLoggedIn() && !currentUser()?.isGuest) {
                <label class="flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    [checked]="saveThisAddress()"
                    (change)="saveThisAddress.set(!saveThisAddress())"
                    class="rounded border-neutral-300"
                  />
                  Save this address to my account
                </label>
              }
            }

            <button
              type="button"
              [disabled]="!canContinueShipping()"
              (click)="confirmShipping()"
              class="self-end mt-1 bg-rose-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              Continue to delivery
            </button>
          </div>
        }
      </div>

      <!-- Step 3: Delivery method -->
      <div
        class="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
        [class.opacity-50]="!isStepDone('shipping')"
      >
        <button
          type="button"
          [disabled]="!isStepDone('shipping')"
          (click)="setActiveStep('delivery')"
          class="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
        >
          @if (isStepDone('delivery')) {
            <span
              class="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center flex-shrink-0"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="3"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </span>
          } @else {
            <span
              class="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 text-xs font-medium flex items-center justify-center flex-shrink-0"
              >3</span
            >
          }
          <span class="text-sm sm:text-base font-medium text-neutral-900">Delivery method</span>
        </button>

        @if (activeStep() === 'delivery') {
          <div
            class="px-4 sm:px-5 pb-5 flex flex-col gap-2"
            [formGroup]="checkoutForm.controls.delivery"
          >
            @for (option of deliveryOptions; track option.id) {
              <label
                class="flex items-center justify-between border rounded-xl px-4 py-3 cursor-pointer"
                [class.border-rose-600]="
                  checkoutForm.controls.delivery.controls.method.value === option.id
                "
                [class.border-neutral-200]="
                  checkoutForm.controls.delivery.controls.method.value !== option.id
                "
              >
                <span class="flex items-center gap-3">
                  <input
                    type="radio"
                    formControlName="method"
                    name="delivery"
                    [value]="option.id"
                    class="accent-rose-600"
                  />
                  <span>
                    <span class="block text-sm font-medium text-neutral-900">{{
                      option.label
                    }}</span>
                    <span class="block text-xs text-neutral-500">{{ option.eta }}</span>
                  </span>
                </span>
                <span class="text-sm font-medium text-neutral-900">
                  {{ option.price === 0 ? 'Free' : (option.price | currency: 'INR') }}
                </span>
              </label>
            }

            <button
              type="button"
              (click)="completeStep('delivery', 'payment')"
              class="self-end mt-2 bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 rounded-full"
            >
              Continue to payment
            </button>
          </div>
        }
      </div>

      <!-- Step 4: Payment -->
      <div
        class="bg-white rounded-2xl border border-neutral-200 overflow-hidden"
        [class.opacity-50]="!isStepDone('delivery')"
      >
        <button
          type="button"
          [disabled]="!isStepDone('delivery')"
          (click)="setActiveStep('payment')"
          class="w-full flex items-center gap-3 px-4 sm:px-5 py-4 text-left"
        >
          <span
            class="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 text-xs font-medium flex items-center justify-center flex-shrink-0"
            >4</span
          >
          <span class="text-sm sm:text-base font-medium text-neutral-900">Payment</span>
        </button>

        @if (activeStep() === 'payment') {
          <div class="px-4 sm:px-5 pb-5 flex flex-col gap-3">
            <p class="text-sm text-neutral-500">
              You'll be redirected to Razorpay to complete payment securely.
            </p>
            <button
              type="button"
              [disabled]="!cartItems().length || isLoading()"
              (click)="placeOrder()"
              class="bg-neutral-900 disabled:bg-neutral-300 text-white text-sm font-semibold px-5 py-3 rounded-full"
            >
              {{ isLoading() ? 'Processing...' : 'Pay ' + (grandTotal() | currency: 'INR') }}
            </button>
          </div>
        }
      </div>
    </div>

    <!-- Right: persistent order summary -->
    @if (cartItems().length) {
      <app-order-summary
        [items]="cartItems()"
        [shipping]="selectedDeliveryPrice()"
        (applyPromo)="onApplyPromo($event)"
      />
    }
  </div>
</section>

  `
})
export class CheckoutNewComponent implements OnInit {
  // ---- DI ----------------------------------------------------------------
  private ngZone = inject(NgZone);
  private _cartService = inject(CartService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private fb = inject(FormBuilder);
  _checkOutService = inject(CheckOutService);
  private _authService = inject(AuthService);
  private addressService = inject(AddressService);
  private _alertService = inject(AlertService);
  private platformId = inject(PLATFORM_ID);
  route = inject(ActivatedRoute);

  isLoggedIn = this._authService.isLoggedIn;
  currentUser = this._authService.currentUser;

  // ---- Wizard state -------------------------------------------------------
  activeStep = signal<CheckoutStep>('contact');
  completedSteps = signal<Set<CheckoutStep>>(new Set());
  isLoading = signal(false);

  // ---- Reactive form --------------------------------------------------
  // One typed form, split into logical groups. Field names match `Address`
  // field-for-field (minus _id/isDefault) so toAddressPayload() below is just
  // a spread, not a translator.
  checkoutForm = this.fb.nonNullable.group({
    contact: this.fb.nonNullable.group({
      email: [this.currentUser()?.email ?? '', [Validators.required, Validators.email]],
      phone: [this.currentUser()?.phone ?? '', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    }),
    shipping: this.fb.nonNullable.group({
      fullName: ['', Validators.required],
      address: ['', Validators.required],
      landmark: [''],
      pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
      locality: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['India'],
    }),
    delivery: this.fb.nonNullable.group({
      method: ['standard', Validators.required],
    }),
  });

  // Bridges each sub-group's RxJS statusChanges into a signal so template
  // conditions (`[disabled]`) can react without manually re-checking .valid
  // on every change-detection pass.
  private contactStatus = toSignal(this.checkoutForm.controls.contact.statusChanges, {
    initialValue: this.checkoutForm.controls.contact.status,
  });
  private shippingStatus = toSignal(this.checkoutForm.controls.shipping.statusChanges, {
    initialValue: this.checkoutForm.controls.shipping.status,
  });
  private deliveryMethod = toSignal(this.checkoutForm.controls.delivery.controls.method.valueChanges, {
    initialValue: this.checkoutForm.controls.delivery.controls.method.value,
  });

  isContactValid = computed(() => this.contactStatus() === 'VALID');
  canContinueShipping = computed(
    () => this.shippingStatus() === 'VALID' && this.pincodeStatus() === 'serviceable'
  );

  // ---- Pincode lookup -----------------------------------------------------
  pincodeStatus = signal<'idle' | 'checking' | 'serviceable' | 'unserviceable'>('idle');
  pincodeLookupDone = computed(() => this.pincodeStatus() === 'serviceable');
  postOfficeOptions = signal<PostOfficeLookup[]>([]);

  // ---- Saved addresses ------------------------------------------------
  savedAddresses = signal<Address[]>([]);
  selectedAddressId = signal<string | null>(null);
  addressMode = signal<'saved' | 'new'>('new');
  saveThisAddress = signal(true);
  saveInfoForNextTime = signal(false);

  // ---- Delivery options -------------------------------------------------
  deliveryOptions = [
    { id: 'standard', label: 'Standard delivery', eta: '4-6 business days', price: 0 },
    { id: 'express', label: 'Express delivery', eta: '1-2 business days', price: 99 },
  ];
  selectedDeliveryPrice = computed(
    () => this.deliveryOptions.find((o) => o.id === this.deliveryMethod())?.price ?? 0
  );

  // ---- Cart ---------------------------------------------------------------
  cartItems = signal<CartItemN[]>([]);
  grandTotal = computed(
    () =>
      this.cartItems().reduce(
        (sum, i) => sum + (i.type === 'subscription' ? i.price : i.priceAtPurchase * i.qty),
        0
      ) + this.selectedDeliveryPrice()
  );


  indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep', 'Puducherry',
  ];
  isShowSummary: boolean = false;
  buyNowId: any = this.route.snapshot.queryParamMap.get('buyNow');;

  constructor() {
    this.watchPincode();
  }

  async ngOnInit() {
    this.cartItems.set([])
    this.isShowSummary = false;
    this.buyNowId = this.route.snapshot.queryParamMap.get('buyNow');

    if (this.buyNowId) {
      this._cartService.buyNowSession(this.buyNowId).subscribe({
        next: (res: any) => {
          this.cartItems.set(res.items ?? []);
        },
        error: () => {
          this.toast.showSuccess('This checkout link has expired.');
          this.cartItems.set([])
          this.router.navigate(['/']);

        },
      });
    } else {
      this.getCartApi();
    }

    if (!this.isLoggedIn() || !this.currentUser()) {
      this.addressMode.set('new');
      return;
    }

    const addresses = await this.addressService.getMyAddresses();
    this.savedAddresses.set(addresses);
    const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
    if (defaultAddr) this.selectSavedAddress(defaultAddr);
  }

  // ---- Pincode watcher ------------------------------------------------
  // Replaces the old manual setTimeout debounce. switchMap cancels any
  // in-flight lookup the moment a newer pincode comes in, so a slow response
  // for an old value can never clobber a newer one.
  private watchPincode() {
    this.checkoutForm.controls.shipping.controls.pincode.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        tap((value) => {
          this.pincodeStatus.set('idle');
          if (!/^\d{6}$/.test(value)) {
            this.postOfficeOptions.set([]);
            if (this.addressMode() === 'new') {
              this.checkoutForm.controls.shipping.patchValue(
                { locality: '', city: '', state: '' },
                { emitEvent: false }
              );
            }
          }
        }),
        filter((value): value is string => /^\d{6}$/.test(value)),
        tap(() => this.pincodeStatus.set('checking')),
        switchMap((pincode) =>
          this._checkOutService.checkPincode(pincode).pipe(catchError(() => of(null)))
        ),
        takeUntilDestroyed()
      )
      .subscribe((res) => this.applyPincodeResult(res));
  }

  private applyPincodeResult(res: PincodeResponse | null) {
    if (!res || !res.postOffices?.length) {
      this.pincodeStatus.set('unserviceable');
      this.postOfficeOptions.set([]);
      return;
    }

    this.postOfficeOptions.set(res.postOffices);
    this.pincodeStatus.set('serviceable');

    if (this.addressMode() === 'new') {
      const first = res.postOffices[0];
      this.checkoutForm.controls.shipping.patchValue(
        { locality: first.name ?? '', city: first.block ?? '', state: first.state ?? '' },
        { emitEvent: false }
      );
    }
  }

  onPostOfficeSelect(name: string) {
    const po = this.postOfficeOptions().find((p) => p.name === name);
    if (po) {
      this.checkoutForm.controls.shipping.patchValue({ locality: po.name, city: po.block, state: po.state });
    }
  }

  // ---- Cart -----------------------------------------------------------
  private getCartApi() {
    this._cartService.getCartAPI().subscribe({
      next: (res: any) => {
        let cartMap = res.items.map(({ price, ...rest }: any) => ({
          ...rest,
          priceAtPurchase: price,
        }));

        this.cartItems.set(cartMap)
      },
      error: (err) => {
        this.cartItems.set([])
        this.toast.showSuccess(err?.error?.message ?? 'something went wrong while loading the cart');
      },
    });
  }

  // ---- Saved addresses --------------------------------------------------
  selectSavedAddress(addr: Address) {
    this.addressMode.set('saved');
    this.selectedAddressId.set(String(addr._id));
    this.postOfficeOptions.set([]);
    this.pincodeStatus.set('checking');

    this.checkoutForm.controls.shipping.patchValue({
      fullName: addr.fullName,
      address: addr.address,
      locality: addr.locality ?? '',
      landmark: addr.landmark ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country ?? 'India',
    });
    this.checkoutForm.controls.contact.patchValue({ phone: addr.phone });

  }

  startNewAddress() {
    this.addressMode.set('new');
    this.selectedAddressId.set(null);
    this.pincodeStatus.set('idle');
    this.postOfficeOptions.set([]);
    this.checkoutForm.controls.shipping.reset({ country: 'India' });
  }

  private toAddressPayload(): Omit<Address, '_id' | 'isDefault'> {
    const shipping = this.checkoutForm.controls.shipping.getRawValue();
    return {
      ...shipping,
      phone: this.checkoutForm.controls.contact.getRawValue().phone,
    };
  }

  async confirmShipping() {
    const canSaveAddress = this.isLoggedIn() && !this.currentUser()?.isGuest;
    if (canSaveAddress && this.addressMode() === 'new' && this.saveThisAddress()) {
      const saved = await this.addressService.addAddress(this.toAddressPayload());
      this.savedAddresses.update((list) => [...list, saved]);
      this.selectedAddressId.set(String(saved._id));
    }
    this.completeStep('shipping', 'delivery');
  }

  // ---- Overview stepper -----------------------------------------------
  stepperNodes: StepperNode[] = [
    { id: 'information', label: 'Information', matches: ['contact', 'shipping'] },
    { id: 'delivery', label: 'Delivery', matches: ['delivery'] },
    { id: 'payment', label: 'Payment', matches: ['payment'] },
  ];

  isNodeActive(node: StepperNode): boolean {
    return node.matches.includes(this.activeStep());
  }

  isNodeDone(node: StepperNode): boolean {
    return node.matches.every((s) => this.isStepDone(s));
  }

  // A node can be jumped to once it's done, once it's the active one, or once
  // the node immediately before it is done - never skip further ahead than that.
  canJumpToNode(node: StepperNode): boolean {
    const idx = this.stepperNodes.indexOf(node);
    if (idx === 0) return true;
    return this.isNodeDone(node) || this.isNodeActive(node) || this.isNodeDone(this.stepperNodes[idx - 1]);
  }

  jumpToNode(node: StepperNode) {
    if (!this.canJumpToNode(node)) return;
    const target = node.matches.find((s) => !this.isStepDone(s)) ?? node.matches[node.matches.length - 1];
    this.setActiveStep(target);
  }

  // ---- Steps --------------------------------------------------------------
  isStepDone(step: CheckoutStep): boolean {
    return this.completedSteps().has(step);
  }

  setActiveStep(step: CheckoutStep) {
    this.activeStep.set(step);
  }

  completeStep(step: CheckoutStep, next: CheckoutStep) {
    this.completedSteps.update((set) => new Set(set).add(step));
    this.activeStep.set(next);
  }

  onApplyPromo(code: string) {
    // TODO: validate against your real promo/coupon endpoint
    // console.log('Applying promo code:', code);
  }

  // ---- Auth ----------------------------------------------------------
  loginWithGoogle() { }
  googleSignupClick() { }

  // ---- Order / payment ----------------------------------------------------
  placeOrder() {
    if (this.isLoading()) return; // guard against double-submit

    const shippingData = this.checkoutForm.controls.shipping.getRawValue();
    const contact = this.checkoutForm.controls.contact.getRawValue();


    // console.log(this.cartItems())

    const objfinal = {
      items: this.cartItems(),
      shippingAddress: { ...shippingData, phone: contact.phone },
      billingAddress: { ...shippingData, phone: contact.phone },
      guestDetails: {
        email: contact.email,
        firstName: shippingData.fullName,
        fullName: shippingData.fullName,
        phone: contact.phone,
      },
    };
    // console.log('Grand total:', this.grandTotal());
    // console.log('this.cartItems() total:', this.cartItems());
    // console.log('shippingData', shippingData)
    // console.log('contact', contact)
    // this.isLoading.set(true);
    this._checkOutService.checkoutProductOrder(objfinal).subscribe({
      next: (res: any) => {
        if (isPlatformBrowser(this.platformId)) {
          this.initiatePayment(res);
        }
        this.isLoading.set(false);
        this.toast.showSuccess('Order placed successfully!');
      },
      error: (err) => {
        this.toast.showSuccess(err?.error?.message ?? 'something went wrong');
        this.isLoading.set(false);
      },
    });
  }

  async initiatePayment(data: any) {
    let isLoaded;
    if (isPlatformBrowser(this.platformId)) isLoaded = await this.loadRazorpayScript();

    if (!isLoaded) {
      alert('Failed to load SDK. Check your connection.');
      return;
    }

    const contact = this.checkoutForm.controls.contact.getRawValue();
    const shipping = this.checkoutForm.controls.shipping.getRawValue();

    const options = {
      key: environment.razorpayKeyId,
      amount: data.razorpayOrder.amount,
      currency: 'INR',
      name: 'Aroved  Health Store meiheal',
      order_id: data.razorpayOrder.id,
      handler: (response: any) => {
        if (isPlatformBrowser(this.platformId)) {
          document.querySelector('.razorpay-container')?.remove();
        }

        this._checkOutService.verifyCheckoutPayment(response).subscribe({
          next: (res: any) => {
            this.isLoading.set(false);
            if (res.success) {
              this.toast.showSuccess('Order placed successfully!' + res?.order?._id);
              this.router.navigate(['/payment-success', res?.order._id], { queryParams: { token: res.token } });
              this.ngZone.run(() => {
                this.router.navigate(['/payment-success', res?.order._id], { queryParams: { token: res.token } });
              });
            } else {
              this.toast.showSuccess('Order placed Failed!');
              this.router.navigate(['/payment-failure']);
            }
          },
          error: (err) => {
            this.toast.showSuccess(err?.error?.message ?? 'something went wrong');
            this.isLoading.set(false);
          },
        });
      },
      modal: {
        ondismiss: () => {
          this.isLoading.set(false);
        },
      },
      prefill: {
        name: shipping.fullName,
        email: contact.email,
        contact: contact.phone,
      },
      theme: { color: '#3399cc' },
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (response: any) => {
      this.toast.showSuccess('Payment failed: ' + response.error.description);
      this.isLoading.set(false);
      this.ngZone.run(() => this.router.navigate(['/payment-failure']));
    });

    rzp.open();
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }
}