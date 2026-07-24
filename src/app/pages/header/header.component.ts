import { Component, DestroyRef, EventEmitter, HostListener, inject, Input, NgZone, OnDestroy, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { animationFrameScheduler, asyncScheduler, distinctUntilChanged, fromEvent, map, of, Subject, takeUntil, throttleTime } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../services/cart.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

export interface HeaderCategory {
  name: string;
  url: string;
  image: string;
}
 
export interface HeaderNavLink {
  label: string;
  url: string;
  external?: boolean;
}
 



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports:[CommonModule,RouterModule ,FormsModule,ReactiveFormsModule],
  styleUrls: ['./header.component.scss'],
  standalone: true
})
export class HeaderComponent implements OnInit, OnDestroy {
  /** Product/collection categories shown in the "Categories" mega menu. */
  @Input() categories: HeaderCategory[] = [];

  /** Links shown under the "More" dropdown (desktop) / accordion (mobile). */
  @Input() moreLinks: HeaderNavLink[] = [];
 
  @Input() logoUrl = '/logo.png';
  @Input() logoAlt = 'Store logo';
  @Input() announcementText:string = 'Free shipping on orders over ₹999';
 
  // --- UI state -----------------------------------------------------------
  readonly isSticky = signal(false);
  readonly mobileMenuOpen = signal(false);
  readonly mobileCategoriesOpen = signal(false);
  readonly mobileMoreOpen = signal(false);
 
  private readonly announcementHeightPx = 40;
 
  
  readonly cart ;
  constructor(private  cartService: CartService) {
    this.cart = cartService;
  }
  ngOnInit(): void {

  }
  ngOnDestroy(): void {
   
  }
 
  @HostListener('window:scroll')
  onWindowScroll(): void {
    const scrolled = (typeof window !== 'undefined' ? window.scrollY : 0) > this.announcementHeightPx;
    if (scrolled !== this.isSticky()) {
      this.isSticky.set(scrolled);
    }
  }
 
  openMobileMenu(): void {
    this.mobileMenuOpen.set(true);
  }
 
  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
    this.mobileCategoriesOpen.set(false);
    this.mobileMoreOpen.set(false);
  }
 
  toggleMobileCategories(): void {
    this.mobileCategoriesOpen.update(v => !v);
  }
 
  toggleMobileMore(): void {
    this.mobileMoreOpen.update(v => !v);
  }
 
  openCart(event?: Event): void {
    event?.preventDefault();
    this.cartService.open();
  }
 
  closeCart(): void {
    this.cartService.close();
  }
 
  decrementQty(key: string, currentQty: number): void {
    // this.cartService.updateQuantity(key, currentQty - 1);
  }
 
  incrementQty(key: string, currentQty: number): void {
    // this.cartService.updateQuantity(key, currentQty + 1);
  }
 
  removeItem(key: string): void {
    // this.cartService.removeItem(key);
  }
 
  onSearchSubmit(query: string): void {
    // Wire this up to your search route, e.g.:
    // this.router.navigate(['/search'], { queryParams: { q: query } });
  }

}
