
import { Component, inject, NgZone, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DietService } from '../../services/diet.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, combineLatest, EMPTY, filter, map, switchMap } from 'rxjs';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { AlertService } from '../../services/alert.service';
import { LucideAngularModule } from 'lucide-angular';
import { PaymentSuccessComponent } from '../payments/payment-success/payment-success.component';
declare let gtag: Function;

@Component({
  selector: 'app-order-summary-success',
  templateUrl: './order-summary.component.html',
  styleUrls: ['./order-summary.component.scss'],
  standalone: true,
    imports:[LucideAngularModule,ReactiveFormsModule,CommonModule,PaymentSuccessComponent]
})
export class OrderSummaryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _dietService = inject(DietService);
  private platformId = inject(PLATFORM_ID);
  _authService = inject(AuthService);
  private alertService = inject(AlertService);
  setupToken: string | null = null;
  createPasswordForm: FormGroup;
  loading: boolean = false;

  constructor(private meta: Meta, private ngZone: NgZone) {
    this.meta.addTag({ name: 'robots', content: 'noindex' });

    this.createPasswordForm = new FormGroup({
      password: new FormControl(null, [
        Validators.required,
        Validators.maxLength(12),
        Validators.minLength(8),
      ]),
      confirm_password: new FormControl(null, [Validators.required]),

    });
  }

  createPassword() {
    console.log('this.createPasswordForm ', this.createPasswordForm)
    if (this.createPasswordForm.invalid) {
      this.createPasswordForm.markAllAsTouched();
      console.log("Form is invalid!");
      return;
    }

    const formData = this.createPasswordForm.getRawValue();

    const apiPayload: Partial<any> = {
      new_password: formData.password,
      confirm_password: formData.confirm_password,
      setupToken: this.setupToken,
    };

    this.loading = true;

    this._authService.resetPasswordPP(apiPayload).subscribe(
      (data) => {
        this.loading = false;
        this.alertService.success('Signup Successful.');
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'resetpasswordPP');

        this.ngZone.run(() => {
          this.router.navigate(['/dashboard']);
        });
      },
      (error) => {
        this.loading = false;
        console.log(error);
      },
    );
  }



  orderData = toSignal(
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap
    ]).pipe(
      map(([params, query]) => ({
        id: params.get('id'),
        token: query.get('token')
      })),
      filter(({ id }) => !!id),
      switchMap(({ id, token }) => {
        if (!isPlatformBrowser(this.platformId)) {
          return EMPTY;
        }

        // Store token if you'll need it later
        this.setupToken = token;


        return this._dietService.getOrderById(id!).pipe(
          catchError(err => {
            console.error('Order fetch failed:', err);
            this.router.navigate(['/']);
            return EMPTY;
          })
        );
      }),
      map((res: any) => res.data)
    )
  );

  ngOnInit() {
    this.trackGoogleAdsConversion();
  }




  trackGoogleAdsConversion() {
    if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
      // 3. Fire the conversion event
      gtag('event', 'conversion', {
        'send_to': 'AW-18210588554/o9z2CIvl2bgcEIqPvutD',
        'value': this.orderData()?.totalAmount, // Replace with the actual dynamic payment amount
        'currency': 'INR',
        'transaction_id': 'orderData()?._id' // Optional: Pass the Razorpay order ID to prevent duplicate tracking
      });


  }


}
