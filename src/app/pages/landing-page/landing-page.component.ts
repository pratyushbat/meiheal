

import { AfterViewInit, Component, computed, ElementRef, importProvidersFrom, inject, OnDestroy, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';


import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ToastService } from '../../services/toastr.service';
import { DietService } from '../../services/diet.service';
import { USubscriptionPlan } from '../../models/diet.model';
import { SeoService } from '../../services/seo.service';
import { AuthService } from '../../services/auth.service';
import { Meta } from '@angular/platform-browser';
import { ProductListResponse } from '../../services/product.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HeroSliderComponent } from '../../shared/pages/hero-slider/hero-slider';

import { Globe } from 'lucide-angular';
import { TopPicksComponent, TopPicksTab } from '../../shared/pages/top-picks/top-picks';
import { bestSellerTabs } from '../../shared/pages/top-picks/bestSeller';
import { HeroSlide, SlideShowComponent } from '../../shared/pages/slide-show/slide-show';

@Component({
  selector: 'landing-page',
  imports: [CommonModule, LucideAngularModule, RouterModule, HeroSliderComponent, TopPicksComponent,SlideShowComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss'],

  standalone: true
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {

heroSlides: HeroSlide[] = [
  {
    imageDesktop: '//healthsense.in/cdn/shop/files/1.svg?v=1784200587&width=2400',
    imageMobile: '//healthsense.in/cdn/shop/files/ChatGPT_Image_Jun_10_2026_11_16_45_AM.png?v=1781070495&width=800',
    alt: '',
    width: 1890,
    height: 832
  },
  {
    imageDesktop: '//healthsense.in/cdn/shop/files/2_50c71721-25f8-4ee3-8d36-2892807e33d4.svg?v=1784200601&width=2400',
    imageMobile: '//healthsense.in/cdn/shop/files/ChatGPT_Image_Jun_10_2026_11_16_50_AM.png?v=1781070520&width=800',
    alt: '',
    width: 1890,
    height: 832
  },
  {
    imageDesktop: '//healthsense.in/cdn/shop/files/3_8d14ddbb-666a-4f40-8e2d-ae6417744f96.svg?v=1784200616&width=2400',
    imageMobile: '//healthsense.in/cdn/shop/files/ChatGPT_Image_Jun_10_2026_11_16_48_AM.png?v=1781070536&width=800',
    alt: '',
    width: 1890,
    height: 832
  },
  {
    imageDesktop: '//healthsense.in/cdn/shop/files/4_f66702cf-bac0-457a-ab56-618d4433007c.svg?v=1784200635&width=2400',
    imageMobile: '//healthsense.in/cdn/shop/files/ChatGPT_Image_Jun_10_2026_11_16_52_AM.png?v=1781070550&width=800',
    alt: '',
    width: 1890,
    height: 832
  },
  {
    imageDesktop: '//healthsense.in/cdn/shop/files/5_7669cbd5-0231-4676-90d3-939cf9e9f064.svg?v=1784200655&width=2400',
    alt: '',
    width: 1890,
    height: 832
  }
];
  title: string = 'Mei Heal — Healthy Products';
  description: string = `Personalized Health porducts`;
  url: string = 'https://www.meiheal.com';
  image: string = 'https://www.meiheal.com/landingth.webp';
  bestSellerTabs: TopPicksTab[] = bestSellerTabs
  private toast = inject(ToastService);
  products = signal<USubscriptionPlan[]>([]);
  isLoading = signal<boolean>(true);
  _authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  planLabels = [
    'Starter Transformation',
    'Transformation Essentials',
    'Complete Wellness Program'
  ];
  // 1. Grab references to the slide divs from your HTML
  @ViewChild('slide1') slide1!: ElementRef;
  @ViewChild('slide2') slide2!: ElementRef;
  @ViewChild('slide3') slide3!: ElementRef;
  private intervalId: any;
  private currentSlide = 1;
  private route = inject(ActivatedRoute);
  productListRes = signal<ProductListResponse | null>(this.route.snapshot.data['productList']);
  productsList = computed(() => this.productListRes()?.products ?? []);
  isProductsLoading = signal<boolean>(false);
  @ViewChild('productTrack') productTrack?: ElementRef<HTMLElement>;


  ngAfterViewInit() {
    // 2. Start the timer ONLY in the browser (Protects your SSR server)
    if (isPlatformBrowser(this.platformId)) {
      this.startAutoPlay();
    }
  }

  ngOnDestroy() {
    // 3. Always clean up timers when the component is destroyed
    this.stopAutoPlay();
  }

  scrollProducts(direction: 1 | -1): void {
    this.productTrack?.nativeElement.scrollBy({
      left: direction * 300,
      behavior: 'smooth'
    });
  }

  startAutoPlay() {
    this.intervalId = setInterval(() => {
      // Loop back to 1 if we pass slide 3
      this.currentSlide = this.currentSlide >= 3 ? 1 : this.currentSlide + 1;
      this.scrollToSlide(this.currentSlide);
    }, 3000); // 3000ms = 3 seconds
  }

  stopAutoPlay() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  // 4. Method to handle manual clicks from the arrow buttons
  goToSlide(slideNumber: number) {
    this.currentSlide = slideNumber;
    this.scrollToSlide(this.currentSlide);

    // Reset the timer so it doesn't auto-scroll immediately after a user clicks
    if (isPlatformBrowser(this.platformId)) {
      this.stopAutoPlay();
      this.startAutoPlay();
    }
  }

  private scrollToSlide(slideNumber: number) {
    // 1. Figure out which slide we want to go to
    let targetSlide: ElementRef | undefined;
    if (slideNumber === 1) targetSlide = this.slide1;
    if (slideNumber === 2) targetSlide = this.slide2;
    if (slideNumber === 3) targetSlide = this.slide3;

    if (targetSlide && targetSlide.nativeElement) {
      const slideElement = targetSlide.nativeElement;
      const carouselContainer = slideElement.parentElement; // Grabs the <div class="carousel">

      // 2. Scroll ONLY the carousel horizontally, leaving the main window alone!
      carouselContainer.scrollTo({
        left: slideElement.offsetLeft,
        behavior: 'smooth'
      });
    }
  }
  constructor(private seoService: SeoService,
    private _dietService: DietService, private meta: Meta) {

  }

  ngOnInit(): void {
    // this.seoService.updateSeoTags({
    //   title: this.title,
    //   description: this.description,
    //   url: this.url,
    //   image: this.image
    // });

    // this.seoService.setStructuredData({
    //   "@context": "https://schema.org",
    //   "@type": "MedicalBusiness",
    //   "name": "Mei Heal",
    //   "alternateName": "meiheal",
    //   "url": this.url,
    //   "logo": {
    //     "@type": "ImageObject",
    //     "url": "https://www.meiheal.com/images/dlogob.webp"
    //   },
    //   "image": this.image,
    //   "description": this.description,
    //   "priceRange": "₹₹",
    //   "jobTitle": "Clinical Nutritionist &  Health Store ",
    //   "areaServed": {
    //     "@type": "Country",
    //     "name": "India"
    //   },
    //   "sameAs": [
    //     "https://www.facebook.com/profile.php?id=61590369990172",
    //     "https://instagram.com/meihealmeiheal",
    //     "https://www.linkedin.com/in/meiheal",
    //     "https://www.youtube.com/@meiheal",
    //     "https://x.com/meiheal"
    //   ],
    //   "contactPoint": {
    //     "@type": "ContactPoint",
    //     "telephone": "+91-9354999067",
    //     "contactType": "customer service",
    //     "availableLanguage": [
    //       "English",
    //       "Hindi"
    //     ]
    //   },
    //   "mainEntityOfPage": {
    //     "@type": "WebPage",
    //     "@id": this.url
    //   }
    // });

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: 'Mei Heal | Mei Heal — Healthy Products'
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: 'Mei Heal — Healthy Products'
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: 'https://www.meiheal.com/landingth.webp'
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: 'https://www.meiheal.com/'
    });

    // Optional
    this.meta.updateTag({
      name: 'twitter:site',
      content: '@meiheal'
    });

    this.meta.updateTag({
      name: 'twitter:creator',
      content: '@meiheal'
    });

    if (isPlatformBrowser(this.platformId)) {
      this.getDietPlans();
    }

  }

  getIconName(index: number): string {
    const icons = ['BadgeDollarSign', 'BadgeCheck', 'Wallet'];
    return icons[index] || 'Wallet';
  }

  getDietPlans() {
    this._dietService.getDietPlans().subscribe({
      next: (res: USubscriptionPlan[]) => {
        this.products.set(res);
        this.isLoading.set(false);
      },
      error: err => {
        this.isLoading.set(false);
        if (!!err.message)
          this.toast.showSuccess('Something wwent wrong !' + err.message);
        else
          this.toast.showSuccess('Something wwent wrong !');

      },
    });
  }




}
