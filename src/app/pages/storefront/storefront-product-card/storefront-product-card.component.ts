// features/product-detail/product-detail.component.ts
import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
// import { StarRatingComponent } from '../star-rating.component';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
// import { CurrencyPipe } from '@angular/common';
// import { Product } from '../../../models/product.model';
import { FormsModule } from '@angular/forms';

// import { SeoService } from '../../core/services/seo.service';


@Component({
  selector: 'storefront-product-card',
  standalone: true,
  imports: [FormsModule],
  template: `
  `,
})
export class StorefrontProductCardComponent implements OnInit {
  // RouetLink Removed
  // StarRatingComponent
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  // private seoService = inject(SeoService);

  product = signal<any>(null);
  activeImage = signal<string>('');
  selectedColor = signal<string>('');
  selectedSize = signal<string>('');
  quantity = signal(1);

  ngOnInit() {
    // const product = this.route.snapshot.data['product'] as Product | null;

    /*   if (!product) {
        return; // resolver already redirected to /404 if this is null
      } */

    // this.product.set(product);
    const product = {
      id: "prod_001",
      slug: "apple-watch-series-10",
      name: "Apple Watch Series 10",
      brand: "Apple",
      price: 49999,
      compareAtPrice: 54999,
      currency: "INR",
      rating: 4.8,
      reviewCount: 326,
      images: [
        "https://picsum.photos/600/600?random=1",
        "https://picsum.photos/600/600?random=2",
        "https://picsum.photos/600/600?random=3"
      ],
      thumbnail: "https://picsum.photos/400/400?random=1",
      shortDescription: "Advanced smartwatch with health tracking.",
      description:
        "Stay connected, track your workouts, monitor your heart rate, and enjoy a stunning Always-On Retina display.",
      features: [
        "GPS + Cellular",
        "ECG App",
        "Blood Oxygen Sensor",
        "Fast Charging",
        "Water Resistant"
      ],
      variants: [
        { color: "Midnight", size: "41mm" },
        { color: "Silver", size: "45mm" }
      ],
      colors: [
        { name: "Midnight", hex: "#1f2937" },
        { name: "Silver", hex: "#d1d5db" }
      ],
      sizes: ["41mm", "45mm"],
      stock: 15,
      category: "Smart Watches",
      tags: ["featured", "apple", "wearables"],
      sku: "APL-WAT-001"
    };
    this.product.set(product);
    this.activeImage.set(product.images[0]);
    this.selectedColor.set(product.colors?.[0]?.name ?? '');
    this.selectedSize.set(product.sizes?.[0] ?? '');
    // this.seoService.setProductSeo(product);
  }

  incrementQty() { this.quantity.update((q) => q + 1); }
  decrementQty() { this.quantity.update((q) => Math.max(1, q - 1)); }

  discountPercent(p: any) {
    return Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100);
  }

  addToCart() {
    this.cartService.addToCart(
      this.product(),
      this.quantity(),
      // this.selectedColor(),
      // this.selectedSize()
    );
  }
}

