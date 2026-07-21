import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { USubscriptionPlan } from '../models/diet.model';
import { environment } from '../../environments/environment';
import { isPlatformServer } from '@angular/common';

const DIET_PLANS_STATE_KEY = makeStateKey<USubscriptionPlan[]>('diet-plans-all');
@Injectable({
  providedIn: 'root'
})
export class DietService {

  private transferState = inject(TransferState);

  // In-memory cache: survives client-side SPA navigation away/back to this page
  private dietPlansCache: USubscriptionPlan[] | null = null;

  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }



  createLead(leadData: any) {
    return this.http.post("/api/lead/createLead ", leadData);
  }



  createOrder(data: any) {
    return this.http.post("/api/subscription/subscribe ", data);
  }

  verifyPayment(data: any) {
    return this.http.post("/api/order/verifyPayment ", data);
  }


  getDietPlans(): Observable<USubscriptionPlan[]> {
    // 1. Client, post-hydration: reuse what the server already fetched
    // console.log('this.transferState.hasKey(DIET_PLANS_STATE_KEY)', this.transferState.hasKey(DIET_PLANS_STATE_KEY))
    // console.log('this.transferState.get(DIET_PLANS_STATE_KEY, [] as DietPlan[])', this.transferState.get(DIET_PLANS_STATE_KEY, [] as USubscriptionPlan[]))
    // console.log('DIET_PLANS_STATE_KEY', DIET_PLANS_STATE_KEY)
    if (this.transferState.hasKey(DIET_PLANS_STATE_KEY)) {
      const cached = this.transferState.get(DIET_PLANS_STATE_KEY, [] as USubscriptionPlan[]);
      this.transferState.remove(DIET_PLANS_STATE_KEY);
      this.dietPlansCache = cached;   // also seed the in-memory cache (fixes the bug we found earlier)
      return of(cached);
    }

    // 2. Client, SPA nav back to this page later: reuse in-memory cache
    if (this.dietPlansCache) {
      return of(this.dietPlansCache);
    }

    return this.http.get<USubscriptionPlan[]>("/api/subplans").pipe(
      tap((res) => {
        // console.log(res)
        this.dietPlansCache = res;
        if (isPlatformServer(this.platformId)) {
          console.log('SSR:DietPlan  setting transferState for', DIET_PLANS_STATE_KEY);
          this.transferState.set(DIET_PLANS_STATE_KEY, res);
        }
      }),
      catchError((err) => {
        console.error('DietService.getDietPlans failed', err);
        return of([]);
      }),
      shareReplay(1)
    );
  }
  getSubsPlanById(slug: string): Observable<USubscriptionPlan> {
    return this.http.get<USubscriptionPlan>("/api/subplans/" + slug);
  }
  getOrderById(orderId: string) {
    return this.http.get<any>("/api/order/orderById/" + orderId);
  }

  getMySubscription() {
    return this.http.get<any>("/api/subscription/mine/");
  }

  getOrderByUserId(userId: string) {
    return this.http.get<any>("/api/order/orderByUserId/" + userId);
  }

  getOrderByUserIdPdf(userId: string) {
    return this.http.get(`/api/order/orderByUserIdPdf/${userId}`, {
      responseType: 'blob'
    });
  }

  retryPayment(leadData: { orderId: any; }) {
    return this.http.get(`/api/order/retryPayment`);
  }


}
