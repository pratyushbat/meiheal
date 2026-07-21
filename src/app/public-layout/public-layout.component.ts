
import { Component, DestroyRef, Inject, inject, NgZone, OnInit, PLATFORM_ID, signal } from '@angular/core';

import { Meta } from '@angular/platform-browser';
import { SeoService } from '../services/seo.service';
import { UtilityService } from '../services/utility.service';
import { AuthService } from '../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { asyncScheduler, distinctUntilChanged, fromEvent, map, of, Subject, take, takeUntil, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';
import { DashboardMobileMenuComponent } from '../pages/dashboard/dashboard-mobile-menu/dashboard-mobile-menu.component';
import { FooterComponent } from '../pages/footer/footer.component';
import { LucideAngularModule } from 'lucide-angular';
import { HeaderComponent } from '../pages/header/header.component';
import { CartDrawerComponent } from '../pages/storefront/storefront-cart-drawer/cart-drawer.component';
import { DHeaderComponent } from '../pages/dashboard/dash-header/dash-header.component';
@Component({
  selector: 'public-layout',
  imports:[CommonModule,DashboardMobileMenuComponent ,DHeaderComponent,FooterComponent,LucideAngularModule,RouterModule,HeaderComponent,CartDrawerComponent],
  templateUrl: './public-layout.component.html',
  styleUrls: ['./public-layout.component.scss'],
  standalone: true
})
export class PublicLayoutComponent {
  router = inject(Router);
  _utilityService = inject(UtilityService);
  public _authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  showScrollButton = signal<boolean>(false);

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) { }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        fromEvent(window, 'scroll').pipe(
          throttleTime(100, asyncScheduler, { leading: true, trailing: true }),
          map(() => {
            const yOffset = window.scrollY || document.documentElement.scrollTop;
            return Math.max(0, yOffset) > 100;
          }),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef)
        ).subscribe(isScrolled => {
          this.ngZone.run(() => {
            if (isPlatformBrowser(this.platformId)) {
              this.showScrollButton.set(isScrolled);
            }
          });

        });
      });
    }
  }


  scrollToTop(event?: Event) {
    if (isPlatformBrowser(this.platformId)) {
      if (event) {
        event.preventDefault(); // 3. Explicitly prevents the browser from rubber-banding
      }

      if (isPlatformBrowser(this.platformId)) {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }
  }

}
