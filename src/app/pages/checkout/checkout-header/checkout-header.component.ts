import { CommonModule } from '@angular/common';
import { Component, inject, Signal, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
// import { AuthService } from '../services/auth.service'; // TODO: point this at your real AuthService

@Component({
    selector: 'app-checkout-header',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <header class="checkout-header">
      <div class="inner">
        <a routerLink="/" class="logo">DWV</a>

        <!-- the ONE thing this header gates on login state -->
        <nav class="public-nav" *ngIf="isLoggedIn() " aria-label="Site navigation">
          <a routerLink="/">Home</a>
          <a routerLink="/products">Shop</a>
          <a routerLink="/dashboard">My Account</a>
          <a routerLink="/dashboard/orders">Orders</a>
        </nav>

        <div class="trust-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true">
            <rect x="4" y="11" width="16" height="9" rx="2"></rect>
            <path d="M8 11V7a4 4 0 0 1 8 0v4"></path>
          </svg>
          Secure checkout
        </div>
      </div>
    </header>
  `,
    styles: [`
    :host {
      --paper:#f6f5f2; --ink:#1c1b19; --muted:#6b675f;
      --line:#e4e1d9; --surface:#ffffff; --accent:#2f5d50; --accent-wash:#e7efec;
      display: block;
      background: var(--surface);
      border-bottom: 1px solid var(--line);
    }
    .inner {
      max-width: 1040px;
      margin: 0 auto;
      padding: 18px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24px;
      flex-wrap: wrap;
      row-gap: 10px;
    }
    .logo {
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--ink);
      text-decoration: none;
      white-space: nowrap;
    }
    .public-nav { display: flex; align-items: center; gap: 24px; font-size: 14px; }
    .public-nav a {
      position: relative;
      color: var(--muted);
      text-decoration: none;
      padding-bottom: 2px;
    }
    .public-nav a::after {
      content: "";
      position: absolute;
      left: 0; right: 0; bottom: -3px;
      height: 1px;
      background: currentColor;
      transform: scaleX(0);
      transform-origin: left;
      transition: transform .18s ease;
    }
    .public-nav a:hover { color: var(--ink); }
    .public-nav a:hover::after { transform: scaleX(1); }
    .trust-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: .02em;
      color: var(--accent);
      background: var(--accent-wash);
      padding: 7px 13px;
      border-radius: 999px;
      white-space: nowrap;
    }
    a:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
    @media (prefers-reduced-motion: reduce) { * { transition: none !important; } }
  `]
})
export class CheckoutHeaderComponent {
    private authService = inject(AuthService);

    /**
     * The only thing this header conditions on login state.
     * Wire this to whatever authGuard/anonGuard already read from —
     * it should be the same source of truth, not a second check.
     */
    isLoggedIn: Signal<boolean> = this.authService.isLoggedIn;
}