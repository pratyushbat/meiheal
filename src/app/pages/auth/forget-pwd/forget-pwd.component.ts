import { Component, inject, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';

import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { map, Subject, switchMap, take, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';


declare let gtag: Function;
@Component({
  selector: 'app-forget-pwd',
  templateUrl: './forget-pwd.component.html',
  styleUrls: ['./forget-pwd.component.scss'],
  standalone: true,
  imports:[RouterModule,CommonModule,FormsModule]
})
export class ForgetPwdComponent implements OnInit, OnDestroy {

  hidePassword: boolean = true;
  countryCode = "91";
  phoneNumber = "";
  email = "";
  loading = false;

  private destroy$ = new Subject<void>();
  private _authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {

  }
  ngOnInit(): void {

  }


  sendresetPwdAccountMail() {
    this._authService.sendresetPwdAccountMail(this.email)
      .subscribe({
        next: () => {

          if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
            gtag('event', 'forgetPwdclick');

          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Login or user data fetch failed:', error);
        }
      });
  }


  ngOnDestroy() {
    this.destroy$?.next();
    this.destroy$?.complete();

  }

}
