import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root' // Makes it a global singleton accessible everywhere
})
export class ToastService {
  // Signals to track alert state
  visible = signal(false);
  message = signal('');

  showSuccess(msg: string) {
    this.message.set(msg);
    this.visible.set(true);

    // Automatically dismiss the alert after 4 seconds
    setTimeout(() => {
      this.visible.set(false);
    }, 8000);
  }
}