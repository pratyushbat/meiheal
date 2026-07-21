
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { SeoService } from '../../../services/seo.service';
import { AuthService } from '../../../services/auth.service';
import { DietService } from '../../../services/diet.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, filter, map, switchMap } from 'rxjs';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss'],
  standalone: true,
  imports:[RouterModule,DatePipe]
})
export class OverviewComponent implements OnInit {
  _authService = inject(AuthService);

  private platformId = inject(PLATFORM_ID);

  public today = new Date();



  orderData = toSignal(
    toObservable(this._authService.currentUser).pipe(

      map(user => user?._id),

      filter(id => !!id),

      switchMap((id) => {
        if (!isPlatformBrowser(this.platformId)) {
          return EMPTY;
        }

        return this._dietService.getOrderByUserId(id as string).pipe(
          catchError((err) => {
            console.error("Order fetch failed. Kicking out:", err);
            return EMPTY;
          })
        );
      }),

      map((res: any) => res?.data)
    )
  );


  activePlan = computed(() => {
    const orders = this.orderData();
    if (!orders || orders.length === 0) return null;

    return orders.find(order => order.status === 'paid' || order.status === 'active');
  });


  public activePlanTwo = signal({
    name: 'Weight Loss & PCOS Management',
    daysRemaining: 42,
    progress: 65 // percentage
  });

  public upcomingConsultation = signal({
    date: 'Oct 24, 2026',
    time: '10:00 AM'
  });


  public recentArticles = signal([
    { title: '5-superfoods-for-energy', excerpt: 'Feeling sluggish by 2 PM? You are not alone...', id: '5-superfoods-for-energy', catid: 'nutrition' },
    { title: 'Hormonal Imbalance in PCOS: A Comprehensive Guide', excerpt: 'we delve into the intricate connection...', id: 'hormonal-imbalance-PCOS', catid: 'pcos' },
    { title: 'Understand Your Weight', excerpt: 'A healthy weight is generally defined as...', id: 'understand-your-weight', catid: 'weight-loss' }
  ]);
  constructor(private seoService: SeoService, private _dietService: DietService) { }


  ngOnInit(): void {


  }


}
