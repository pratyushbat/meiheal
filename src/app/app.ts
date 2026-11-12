import { Component, inject, signal, OnInit, DestroyRef, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastService } from './services/toastr.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from './services/auth.service';

import { HeaderComponent } from './pages/header/header.component';
import { UtilityService } from './services/utility.service';
import { LucideAngularModule } from 'lucide-angular';
import { FooterComponent } from './pages/footer/footer.component';
import { CartDrawerComponent } from './pages/storefront/storefront-cart-drawer/cart-drawer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, LucideAngularModule, FooterComponent, CartDrawerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  toastService = inject(ToastService);
  _authService = inject(AuthService);
  showScrollButton = signal<boolean>(false);
  router = inject(Router);
  _utilityService = inject(UtilityService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) { }

  scrollToTop(event?: Event) {
    if (isPlatformBrowser(this.platformId)) {
      if (event) {
        event.preventDefault();
      }

    }
  }

  ngOnInit(): void {



  }
}
