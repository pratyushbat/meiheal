import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';


import { CheckoutHeaderComponent } from '../checkout-header/checkout-header.component';

@Component({
  selector: 'app-checkout-layout',
  standalone: true,
  imports: [RouterOutlet, CheckoutHeaderComponent],
  template: `
    <app-checkout-header></app-checkout-header>
    <main class="checkout-content">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .checkout-content {
      max-width: 1040px;
      margin: 0 auto;
      padding: 32px 24px 64px;
    }
  `]
})
export class CheckoutLayoutComponent { }