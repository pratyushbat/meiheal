import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Alert } from '../models/alert.model';
import { BehaviorSubject } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private platformId = inject(PLATFORM_ID);
  private alertSubject = new BehaviorSubject<Alert | null>(null);
  alert$ = this.alertSubject.asObservable();

  show(alert: Alert) {

    if (!isPlatformBrowser(this.platformId)) return;
    this.alertSubject.next({ ...alert, id: crypto.randomUUID() });

    if (alert.timeout) {
      setTimeout(() => this.clear(), alert.timeout);
    }
  }

  success(message: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.show({ type: 'success', message, timeout: 3000 });
  }

  error(message: string) {
    if (!isPlatformBrowser(this.platformId)) return;
    this.show({ type: 'error', message });
  }

  clear() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.alertSubject.next(null);
  }

}
