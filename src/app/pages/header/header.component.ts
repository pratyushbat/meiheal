import { Component, DestroyRef, EventEmitter, HostListener, inject, NgZone, OnDestroy, OnInit, Output, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { animationFrameScheduler, asyncScheduler, distinctUntilChanged, fromEvent, map, of, Subject, takeUntil, throttleTime } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartService } from '../../services/cart.service';



@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports:[CommonModule,RouterModule],
  styleUrls: ['./header.component.scss'],
  standalone: true
})
export class HeaderComponent implements OnInit, OnDestroy {
  public readonly cart = inject(CartService);
  _authService = inject(AuthService);
  router = inject(Router);
  private destroy$ = new Subject<void>();
  isLoggingOut = signal<boolean>(false);
  toggleSidebar: boolean = false;
  @Output() onToggle: EventEmitter<any> = new EventEmitter();
  private platformId = inject(PLATFORM_ID);
  isMobileMenuOpen = signal<boolean>(false);
  firstDropDownOpen = signal<boolean>(false);
  secDropDownOpen = signal<boolean>(false);
  thDropDownOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(open => !open);
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = this.isMobileMenuOpen() ? 'hidden' : '';

  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
    if (isPlatformBrowser(this.platformId))
      document.body.style.overflow = '';
  }

  toggleFirstDD(): void {
    this.closesecDD();
    this.closeThDD();
    this.firstDropDownOpen.update(open => !open);

  }

  openFirstDD(): void {
    this.closesecDD();
    this.closeThDD();
    this.firstDropDownOpen.set(true);
  }

  closeFirstDD(): void {
    if (this.firstDropDownOpen())
      this.firstDropDownOpen.set(false);
  }

  togglesecDD(): void {
    this.closeFirstDD();
    this.closeThDD();
    this.secDropDownOpen.update(open => !open);

  }

  opensecDD(): void {
    this.closeFirstDD();
    this.closeThDD();
    this.secDropDownOpen.set(true);
  }

  closesecDD(): void {
    if (this.secDropDownOpen())
      this.secDropDownOpen.set(false);
  }

  toggleThDD(): void {
    this.closesecDD();
    this.closeFirstDD();
    this.thDropDownOpen.update(open => !open);

  }

  openThDD(): void {
    this.closesecDD();
    this.closeFirstDD();
    this.thDropDownOpen.set(true);
  }

  closeThDD(): void {
    if (this.thDropDownOpen())
      this.thDropDownOpen.set(false);
  }
  closeAll() {
    this.closeFirstDD();
    this.secDropDownOpen();
    this.closeThDD();
    this.closeMobileMenu();
  }
  constructor(
    private ngZone: NgZone
  ) {

  }



  accordions = [
    { title: 'My Account', content: 'Submenu 1', isOpen: true, id: 'first' }
  ];

  showScrollButton = signal(false);
  // / Modern way to handle unsubscriptions
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {

      // 2. Run completely outside Angular to prevent Change Detection thrashing
      this.ngZone.runOutsideAngular(() => {

        // 3. Listen to scroll events via RxJS natively
        fromEvent(window, 'scroll').pipe(
          // 2. Add asyncScheduler and the config object here:
          throttleTime(0, animationFrameScheduler),
          map(() => {
            const yOffset = window.scrollY || document.documentElement.scrollTop;

            // 3. Optional but recommended: Handle Mac/iOS "Rubber band" negative scrolling
            return Math.max(0, yOffset) > 100;
          }),
          distinctUntilChanged(),          // ONLY emit when the boolean changes (false -> true)
          takeUntilDestroyed(this.destroyRef) // Prevent memory leaks automatically
        ).subscribe(isScrolled => {

          // 4. Bring it back into Angular ONLY when the state changes
          this.ngZone.run(() => {
            this.showScrollButton.set(isScrolled);
          });

        });
      });
    }
  }
  logout() {

  }
  // isScrolled = false;

  /*   @HostListener('window:scroll', [])
    onWindowScroll() {
      this.isScrolled = window.scrollY > 100;
    } */


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
            this.isMobileMenuOpen.set(false);
            this.isLoggingOut.set(false);
          });

        },
        error: (error) => {
          // console.error('Logout failed', error);
          this._authService.purgeAuth(); // 🚀 The Safety Net
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
