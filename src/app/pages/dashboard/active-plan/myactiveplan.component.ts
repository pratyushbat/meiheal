
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, filter, map, switchMap } from 'rxjs';
import { DietService } from '../../../services/diet.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toastr.service';




@Component({
  selector: 'myactiveplan',
  templateUrl: './myactiveplan.component.html',
  styleUrls: ['./myactiveplan.component.scss'],
  standalone: true,
  imports:[DatePipe]
})
export class MyAcivePlanComponent implements OnInit {

  _authService = inject(AuthService);
  _dietService = inject(DietService);
  _toast = inject(ToastService);
  private platformId = inject(PLATFORM_ID);

  // 1. High-Level Plan Details
  // public planInfo = signal({
  //   name: 'Weight Loss & PCOS Management',
  //   week: 1,
  //   totalWeeks: 12,
  //   daysLeft: 63,
  //   nutritionist: 'Mei Heal',
  // });

  // 2. Today's Macro Targets
  public macros = signal({
    calories: { consumed: 1250, target: 1600 },
    protein: { consumed: 65, target: 90 },
    carbs: { consumed: 120, target: 150 },
    fats: { consumed: 40, target: 55 }
  });

  // 3. Daily Checklist (Interactive)
  public dailyTasks = signal([
    { id: 1, time: '08:00 AM', title: 'Morning Detox', desc: 'Warm water with lemon and chia seeds.', completed: true },
    { id: 2, time: '09:30 AM', title: 'Breakfast', desc: '2 Besan Chilla with mint chutney.', completed: true },
    { id: 3, time: '01:30 PM', title: 'Lunch', desc: '1 bowl Quinoa pulao + cucumber raita.', completed: false },
    { id: 4, time: '05:00 PM', title: 'Evening Snack', desc: '1 cup Green tea + roasted makhanas.', completed: false },
    { id: 5, time: '08:00 PM', title: 'Dinner', desc: 'Grilled paneer salad with olive oil dressing.', completed: false },
    { id: 6, time: 'Anytime', title: 'Hydration', desc: 'Drink 3 liters of water.', completed: false }
  ]);

  // 🚀 Computed Signal: Automatically calculates % of tasks completed today
  public dailyProgress = computed(() => {
    const tasks = this.dailyTasks();
    const completedCount = tasks.filter(t => t.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
  });


  orderData = toSignal(
    this._dietService.getMySubscription().pipe(
      catchError(err => {
        console.error('Order fetch failed:', err);
        return EMPTY;
      })
    ),
    {
      initialValue: null
    }
  );





  // 2. NEW: Compute the active plan automatically
  activePlan = computed(() => {
    const orders = this.orderData();
    // If orders haven't loaded yet, or the array is empty, return null
    if (!orders) return null;
    return orders.status === 'active';

    // Find the first order that has a status of 'paid' or 'active'
    // (Adjust the string to match exactly what your Node backend sends)
    // return orders.find(order => order.status === 'paid' || order.status === 'active');
  });

  ngOnInit(): void {
  }

  // Method to check/uncheck a task
  toggleTask(taskId: number) {
    this.dailyTasks.update(tasks =>
      tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
    // In a real app, you would make an API call to save this to your database here!
  }

  getDietPdfDownload() {
    this._dietService.getOrderByUserIdPdf(this._authService.currentUser()?._id as string).subscribe({
      next: (blob: Blob) => {
        // 1. Create a special URL that points to the raw file data in the browser's memory
        if (isPlatformBrowser(this.platformId)) {
          const url = window.URL.createObjectURL(blob);
          this._toast.showSuccess('pdf downlaodded');
          // 2. Create a hidden HTML anchor (<a>) tag
          const link = document.createElement('a');
          link.href = url;

          // 3. Set the default file name the user will see when saving
          link.download = `Invoice-${this._authService.currentUser()?._id}.pdf`;

          // 4. Append the link to the DOM, click it to trigger the download, then remove it
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // 5. Clean up the memory
          window.URL.revokeObjectURL(url);
        }
      },
      error: err => {
        if (!!err.message)
          this._toast.showSuccess('Something wwent wrong !' + err.message);
        else
          this._toast.showSuccess('Something wwent wrong !');

      },
    });
  }


}
