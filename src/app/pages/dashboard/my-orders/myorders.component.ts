
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toastr.service';
import { USubscriptionPlan } from '../../../models/diet.model';
import { DietService } from '../../../services/diet.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, filter, map, switchMap } from 'rxjs';
import { CurrencyPipe, DatePipe, isPlatformBrowser, TitleCasePipe } from '@angular/common';
import { Router } from 'express';



@Component({
  selector: 'myorders',
  templateUrl: './myorders.component.html',
  styleUrls: ['./myorders.component.scss'],
  standalone: true,
  imports:[TitleCasePipe,DatePipe , CurrencyPipe]
})
export class MyordersComponent implements OnInit {
  private toast = inject(ToastService);
  _authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);

  orderData = toSignal(
    // 1. Convert the Signal to an Observable to watch for changes
    toObservable(this._authService.currentUser).pipe(

      // 2. Extract the ID directly from the User object (no .get() method needed)
      map(user => user?._id),

      // 3. Stop execution here if the user is null or has no ID
      filter(id => !!id),

      // 4. Pass the extracted 'id' into switchMap
      switchMap((id) => {
        if (!isPlatformBrowser(this.platformId)) {
          return EMPTY;
        }

        return this._dietService.getOrderByUserId(id as string).pipe(
          catchError((err) => {
            console.error("Order fetch failed. Kicking out:", err);
            // this.router.navigate(['/']);
            return EMPTY;
          })
        );
      }),

      // 5. Extract the final data payload
      map((res: any) => res?.data)
    )
  );

  constructor(private _dietService: DietService) { }


  ngOnInit(): void {

  }


  isLoading: boolean = false;
  retryOrder(order: any) {
    this.isLoading = true;
    this._dietService.retryPayment({ orderId: order._id }).subscribe({
      next: (res: any) => {
        this.initiatePayment(res); // same Razorpay modal flow you already have
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message || 'Could not retry payment');
        this.isLoading = false;
      },
    });
  }
  initiatePayment(res: any) {

  }



}
