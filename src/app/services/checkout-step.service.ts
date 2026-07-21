import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type CheckoutStep = 'cart' | 'shipping' | 'payment';

/**
 * Single source of truth for "where is the user in checkout".
 * Needed because there's currently one 'checkout' route, not
 * separate routes per step — so progress can't be read from the URL.
 * If you later split checkout into child routes (checkout/shipping,
 * checkout/payment), you can drive this from route data instead and
 * keep the header/indicator components unchanged.
 */
@Injectable({ providedIn: 'root' })
export class CheckoutStepService {
  private readonly order: CheckoutStep[] = ['cart', 'shipping', 'payment'];
  private readonly stepSubject = new BehaviorSubject<CheckoutStep>('cart');

  readonly currentStep$ = this.stepSubject.asObservable();

  setStep(step: CheckoutStep): void {
    this.stepSubject.next(step);
  }

  next(): void {
    const idx = this.order.indexOf(this.stepSubject.value);
    if (idx < this.order.length - 1) {
      this.stepSubject.next(this.order[idx + 1]);
    }
  }

  back(): void {
    const idx = this.order.indexOf(this.stepSubject.value);
    if (idx > 0) {
      this.stepSubject.next(this.order[idx - 1]);
    }
  }
}