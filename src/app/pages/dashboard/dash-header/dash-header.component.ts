import { Component, DestroyRef, EventEmitter, HostListener, inject, NgZone, OnDestroy, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';

import { animationFrameScheduler, asyncScheduler, distinctUntilChanged, fromEvent, map, of, Subject, takeUntil, throttleTime } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../services/auth.service';
import { UtilityService } from '../../../services/utility.service';
import { CartService } from '../../../services/cart.service';



@Component({
  selector: 'dash-header',
  templateUrl: './dash-header.component.html',
  styleUrls: ['./dash-header.component.scss'],
  standalone: true,
  imports:[CommonModule,RouterModule,DatePipe]
})
export class DHeaderComponent implements OnInit, OnDestroy {

  _authService = inject(AuthService);
  cart = inject(CartService);
  _utilityService = inject(UtilityService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();
  isLoggingOut = signal<boolean>(false);
  toggleSidebar: boolean = false;
  @Output() onToggle: EventEmitter<any> = new EventEmitter();
  private platformId = inject(PLATFORM_ID);

  constructor(
    private ngZone: NgZone
  ) {

  }



  accordions = [
    { title: 'My Account', content: 'Submenu 1', isOpen: true, id: 'first' }
  ];

  showScrollButton = signal(false);


  ngOnInit(): void {
  }


  logoutUser() {
    if (this.isLoggingOut()) return;
    this.isLoggingOut.set(true);

    this._authService.logoutUser()
      .pipe(

        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => {

          this.router.navigate(['/login']).then(() => {
            this._utilityService.closeDMobileMenu();
            this._utilityService.closeAllDD();
            this._utilityService.closeAllMDD();
            this.isLoggingOut.set(false);
            this._utilityService.closeAllDD();
          });

        },
        error: (error) => {
          console.error('Logout failed', error);
          this._authService.purgeAuth(); // 🚀 The Safety Net
          this._utilityService.closeAllDD();
          this.isLoggingOut.set(false);
          return of(null);

        }
      });
  }

  ngOnDestroy() {
    this.destroy$?.next();
    this.destroy$?.complete();

  }

  ontoggleSidebar(event?: any) {
    // this.onToggle.emit(this.toggleSidebar)
    this.toggleSidebar = !this.toggleSidebar
  }
}
