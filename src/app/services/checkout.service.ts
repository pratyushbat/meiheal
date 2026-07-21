import { HttpClient } from '@angular/common/http';
import { inject, Inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class CheckOutService {



  constructor(private http: HttpClient, @Inject(PLATFORM_ID) private platformId: Object) { }




  checkoutProductOrder(data: any) {
    return this.http.post("/api/order/checkout-product ", data);
  }

  checkoutSubOrder(data: any) {
    return this.http.post("/api/order/checkout-sub ", data);
  }

  verifyCheckoutPayment(data: any) {
    return this.http.post("/api/order/verifyPayment ", data);
  }



  retryPayment(leadData: { orderId: any; }) {
    return this.http.get(`/api/order/retryPayment`);
  }
  checkPincode(pincode: string): Observable<PincodeResponse> {
    return this.http.get<PincodeResponse>(`/api/order/pincode/${pincode}`);
  }

}

export interface PincodeResponse {
  pincode: number;
  postOffices: PostOffice[];

}

export interface PostOffice {
  name: string;
  district: string;
  state: string;
  block: string;
}