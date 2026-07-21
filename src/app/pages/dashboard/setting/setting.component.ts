
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';

import { Tab } from '../../../models/tab';
import { AuthService } from '../../../services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { MyAddressesComponent } from '../../../shared/pages/my-address-component/my-address-component';
declare let gtag: Function;


@Component({
  selector: 'setting',
  imports: [MyAddressesComponent,],
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.scss'],
  standalone: true
})
export class SettingComponent {

  // Track the currently active tab (default to notifications for this example)
  public activeTab = signal<Tab>('loginDetails');

  // Track the state of the toggle switches
  public emailNotifs = signal(true);
  public smsNotifs = signal(false);
  public marketingNotifs = signal(true);
  isLoading: boolean = false;
  private platformId = inject(PLATFORM_ID);
  _authService = inject(AuthService);
  errorMessage: string = '';
  constructor(
  ) {


  }

  // Method to switch tabs
  setTab(tab: Tab) {
    this.activeTab.set(tab);
  }

  // Method to flip a toggle switch
  toggle(setting: 'email' | 'sms' | 'marketing') {
    if (setting === 'email') this.emailNotifs.update(v => !v);
    if (setting === 'sms') this.smsNotifs.update(v => !v);
    if (setting === 'marketing') this.marketingNotifs.update(v => !v);
  }


  verifyEmailUser() {

    this._authService.verifyUserAccountMail(this._authService.currentUser()?.email).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'verifyuser_click');
        this.isLoading = false;

      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to set password. The link may have expired.';
      }
    });
  }
  saveSettings() {
    // TODO: Call backend API
  }
}
