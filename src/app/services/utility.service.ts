import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { Router } from '@angular/router';
import { CartItemN, Product, ProductVariant } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class UtilityService {
  router = inject(Router);
  hiddenRoutes = ['/login', '/signup', '/forget'];

  isDMobileMenuOpen = signal<boolean>(false);

  toggleDMobileMenu(): void {
    this.isDMobileMenuOpen.update(open => !open);
  }

  closeDMobileMenu(): void {
    this.isDMobileMenuOpen.set(false);
  }


  firstDropDownOpen = signal<boolean>(false);
  secDropDownOpen = signal<boolean>(false);
  thDropDownOpen = signal<boolean>(false);
  fourDropDownOpen = signal<boolean>(false);

  firstMDropDownOpen = signal<boolean>(false);
  secMDropDownOpen = signal<boolean>(false);
  thMDropDownOpen = signal<boolean>(false);
  fourthMDropDownOpen = signal<boolean>(false);



  toggleFirstDD(): void {
    this.closesecDD();
    this.closeThDD();
    this.closeFourthDD();
    this.firstDropDownOpen.update(open => !open);

  }
  openFirstDD(): void {
    this.closesecDD();
    this.closeThDD();
    this.closeFourthDD();

    this.firstDropDownOpen.set(true);

  }

  closeFirstDD(): void {
    if (this.firstDropDownOpen())
      this.firstDropDownOpen.set(false);
  }

  togglesecDD(): void {
    this.closeFirstDD();
    this.closeThDD();
    this.closeFourthDD();
    this.secDropDownOpen.update(open => !open);

  }

  openSecDD(): void {
    this.closeFirstDD();
    this.closeThDD();
    this.closeFourthDD();

    this.secDropDownOpen.set(true);

  }

  closesecDD(): void {
    if (this.secDropDownOpen())
      this.secDropDownOpen.set(false);
  }

  toggleThDD(): void {
    this.closeFirstDD();
    this.closesecDD();
    this.closeFourthDD();
    this.thDropDownOpen.update(open => !open);

  }
  openThDD(): void {
    this.closeFirstDD();
    this.closesecDD();
    this.closeFourthDD();

    this.thDropDownOpen.set(true);

  }

  closeThDD(): void {
    if (this.thDropDownOpen())
      this.thDropDownOpen.set(false);
  }

  toggleFourthDD(): void {
    this.closeFirstDD();
    this.closesecDD();
    this.closeThDD();
    this.fourDropDownOpen.update(open => !open);

  }
  openFourthDD(): void {
    this.closeFirstDD();
    this.closesecDD();
    this.closeThDD();
    this.fourDropDownOpen.set(true);

  }

  closeFourthDD(): void {
    if (this.fourDropDownOpen())
      this.fourDropDownOpen.set(false);
  }



  closeAllDD() {
    this.closeFirstDD();
    this.closesecDD();
    this.closeThDD();
    this.closeFourthDD();
    this.closeDMobileMenu();
  }



  toggleFirstMDD(): void {
    this.closesecMDD();
    this.closeThMDD();
    this.closeFourthMDD();
    this.firstMDropDownOpen.update(open => !open);

  }

  closeFirstMDD(): void {
    if (this.firstMDropDownOpen())
      this.firstMDropDownOpen.set(false);
  }

  togglesecMDD(): void {
    this.closeFirstMDD();
    this.closeThMDD();
    this.closeFourthMDD();
    this.secMDropDownOpen.update(open => !open);

  }

  closesecMDD(): void {
    if (this.secMDropDownOpen())
      this.secMDropDownOpen.set(false);
  }

  toggleThMDD(): void {
    this.closeFirstMDD();
    this.closesecMDD();
    this.closeFourthMDD();
    this.thMDropDownOpen.update(open => !open);

  }

  closeThMDD(): void {
    if (this.thMDropDownOpen())
      this.thMDropDownOpen.set(false);
  }


  toggleFourthMDD(): void {
    this.closeFirstMDD();
    this.closesecMDD();
    this.closeThMDD();
    this.fourthMDropDownOpen.update(open => !open);

  }

  closeFourthMDD(): void {
    if (this.fourthMDropDownOpen())
      this.fourDropDownOpen.set(false);
  }
  closeAllMDD() {
    this.closeFirstMDD();
    this.closesecMDD();
    this.closeThMDD();
    this.closeFourthMDD();
  }

  isAuthRoute(): boolean {
    return this.hiddenRoutes.some(route => this.router.url.includes(route));
  }



  /* 
    toCreateOrderRequest(
      model: Product,
      type: 'product' | 'subscription' = 'product',
      selectedColor?: string,
      selectedSize?: string
    ): Partial<CartItemN> {
  
      const variant: ProductVariant = model.variants.find(
        v => v.sku === model.defaultVariantSku
      ) ?? model.variants[0];
  
  
      const base: Partial<CartItemN> = {
        productId: model.id,
        type,
        sku: model.sku,
        slug: model.slug,
        name: model.name,
        brand: model.brand,
        thumbnail: model.thumbnail,
        price: model.price,
        priceAtPurchase: model.price,
        compareAtPrice: variant.compareAtPrice,
        currency: model.currency,   // was model.id — same bug from before
        qty: 1,
        rating: model.rating,
        reviewCount: model.reviewCount,
        selectedColor,
        selectedSize,
        maxStock: model.stock,
        isOutOfStock: variant.stock <= 0
      };
  
      if (type === 'subscription') {
        base.billingInterval = 'monthly';
      }
  
      return base;
    } */
}

