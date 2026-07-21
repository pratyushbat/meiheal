import { Component, inject, Inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SeoService } from '../../../services/seo.service';
import { CartService } from '../../../services/cart.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';




const validatePassword = (password: any) => {
  const regexForPassword = /[A-Za-z\d]{5,}/;
  const isValid = regexForPassword.test(password);
  return isValid;
};



const validateEmail = (email: any) => {
  const regexForEmail = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const isValid = regexForEmail.test(email);
  return isValid;
};

const validateName = (value: any) => {
  const nameRegex = /^[^\s]+$/;
  const isValid = nameRegex.test(value);
  return isValid;
};

const validatePhoneNumber = (phoneNumber: any) => {
  const phoneRegex = /^\d{10}$/;
  const isValid = phoneRegex.test(phoneNumber);
  return isValid;
};
declare let gtag: Function;
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterModule]
})
export class LoginComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();
  private _authService = inject(AuthService);
  private _cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seoService = inject(SeoService);

  hidePassword: boolean = true;
  countryCode = "91";
  phoneNumber = "";
  email = "";
  isPasswordHidden = false;
  loading = false;
  password = "";
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {

  }

  ngOnInit(): void {
    // this.seoService.updateSeoTags({
    //   title: 'Login',
    //   description: 'Login',
    //   url: `https://www.meiheal.com/login`,
    //   robots: 'noindex,nofollow'
    // });

  }

  googleLoginClick() {
    if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
      gtag('event', 'google_login_click');
  }

  onLogin() {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    if (isPlatformBrowser(this.platformId)) {
      this._authService.loginemail(this.password, this.email)
        .pipe(
          switchMap(() => this._authService.refreshUser()),
          map((user: any) => user.userData),

          takeUntil(this.destroy$),
          finalize(() => this.isLoading.set(false))
        )
        .subscribe({
          next: (userData: any) => {
            this._authService.setAuthenticatedUser(userData);
            const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
            if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
              gtag('event', 'login_click');
            this._cartService.syncCartFromServer();
            this.router.navigateByUrl(returnUrl);
          },
          error: (err) => this.errorMsg.set(err.error?.message ?? 'Login failed')
        });
    }
  }


  ngOnDestroy() {
    this.destroy$?.next();
    this.destroy$?.complete();

  }

}
