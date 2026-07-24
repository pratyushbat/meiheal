import { Component, effect, inject, Inject, NgZone, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertService } from '../../services/alert.service';
import { DietService } from '../../services/diet.service';
import { ActivatedRoute, Router } from '@angular/router';

import { catchError, EMPTY, filter, map, switchMap, tap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { ToastService } from '../../services/toastr.service';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
declare var Razorpay: any;
@Component({
  selector: 'app-orderpay',
  templateUrl: './orderpay.component.html',
  styleUrl: './orderpay.component.scss',
  standalone: true,
  imports:[LucideAngularModule,ReactiveFormsModule]
})
export class OrderPayComponent implements OnInit, OnDestroy {
  /*   private destroy$ = new Subject<void>(); */
  private toast = inject(ToastService);
  private _authService = inject(AuthService);
  public isLoading: boolean = false;
  orderPayForm: any;
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private _dietService = inject(DietService);
  product = toSignal(
    this.route.paramMap.pipe(
      map(params => params.get('slug')),
      filter(slug => !!slug), // Only proceed if ID exists
      switchMap(slug => this._dietService.getSubsPlanById(slug as string).pipe(
        tap(res => console.log('API response', res)),
        catchError((err) => {
          this.router.navigate(['/']); // Redirect safely
          return EMPTY; // Safely halts this specific execution
        })
      )
      )
      // map((res: any) => res.data) // Extract your exact data payload
    )
  );
  constructor(
    private ngZone: NgZone,
    private fb: FormBuilder,
    @Inject(PLATFORM_ID) private platformId: Object) {


    this.orderPayForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', Validators.required],
      gender: ['', Validators.required],
      age: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
      planName: ['', Validators.required],
      planId: ['', Validators.required],
      planPrice: ['', Validators.required],
    });

    effect(() => {
      const data = this.product();
      if (data) {
        this.orderPayForm.patchValue({
          planName: data.name,
          planId: data._id,
          planPrice: data.price
        }, { emitEvent: false });
      }

      if (!!this._authService.currentUser()) {
        this.orderPayForm.patchValue({
          fullName: this._authService.currentUser()?.firstName,
          email: this._authService.currentUser()?.email,
          phone: this._authService.currentUser()?.phone
        }, { emitEvent: false });
      }
    });

  }

  ngOnInit(): void {
  }

  saveOrder() {

    if (this.orderPayForm.invalid) {
      this.toast.showSuccess('Please fill all fields !');
      return;
    }
    if (isPlatformBrowser(this.platformId)) {
      const { email, fullName, phone, planId } = this.orderPayForm.getRawValue();
      const guestDetails: GuestDetailsU = {
        email,
        fullName,
        firstName: fullName.split(' ')[0],
        lastName: fullName.split(' ').slice(1).join(' ') || undefined,
        phone
      };
      const obj: any = {
        guestDetails,
        planId
      };

      this.createOrderApi(obj);
    }

  }


  createOrderApi(data: any) {
    this.isLoading = true;
    this._dietService.createOrder(data).subscribe({
      next: (res: any) => {
        if (isPlatformBrowser(this.platformId)) {
          this.initiatePayment(res);
        }
        this.isLoading = false;
        this.toast.showSuccess('Order placed successfully!');
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong');
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {

      // If the user navigates away while the modal is open, kill it!
      const razorpayContainer = document.querySelector('.razorpay-container');
      if (razorpayContainer) {
        razorpayContainer.remove();
      }
    }

  }


  // Call this when the user clicks "Pay Now"
  async initiatePayment(data: any) {
    let isLoaded;
    if (isPlatformBrowser(this.platformId))
      isLoaded = await this.loadRazorpayScript();

    if (!isLoaded) {
      alert('Failed to load  SDK. Check your connection.');
      return;
    }
    // Now that the script is loaded, you can use the Razorpay instance
    const options = {
      key: environment.razorpayKeyId, // Replace with your Key ID
      amount: data.razorpayOrder.amount,// Amount in paise (50000 paise = 500 INR)
      currency: 'INR',
      name: 'MeiHeal  Store ',
      order_id: data.razorpayOrder.id, // Get this from your Node.js backend
      handler: (response: any) => {
        console.log(',response', response)
        var razorpayContainer;
        // 1. Find the Razorpay modal injected into the body added last
        if (isPlatformBrowser(this.platformId))
          razorpayContainer = document.querySelector('.razorpay-container');

        // 2. Destroy it manually added last
        if (razorpayContainer) {
          razorpayContainer.remove();
        }


        this._dietService.verifyPayment(response).subscribe({
          next: (res: any) => {
            if (res.success) {
              this.toast.showSuccess('Order placed successfully!' + res?.orderId);
              this.ngZone.run(() => {
                this.router.navigate(['/payment-success', res?.order._id], { queryParams: { token: res.token } });
              });

            }
            else {
              this.toast.showSuccess('Order placed Failed!');
              this.router.navigate(['/payment-failure']);
            }

            this.isLoading = false;

          },
          error: err => {
            this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong');
            this.isLoading = false;
          },
        });
      },
      modal: {
        ondismiss: () => {
          this.isLoading = false;
          console.log('Checkout form closed by user');
          // call api to maike it failed
        }
      },
      prefill: {
        name: this.orderPayForm.value.name,
        email: this.orderPayForm.value.email,
        contact: this.orderPayForm.value.phone
      },
      theme: {
        color: '#3399cc'
      }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (response: any) => {
      console.error('Payment Failed:', response.error.description);
      this.toast.showSuccess('Payment failed: ' + response.error.description);
      this.isLoading = false;
      this.ngZone.run(() => {
        this.router.navigate(['/payment-failure']);
      });
    });

    rzp.open();
  }

  // The helper function that injects the script into the DOM
  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';

      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);

      document.body.appendChild(script);
    });
  }




}


export interface GuestDetailsU {
  email: string;
  firstName: string;
  lastName?: string;
  fullName: string;
  phone: string;
}