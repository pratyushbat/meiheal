import { Component, inject, signal, OnInit, DestroyRef, NgZone, PLATFORM_ID, Inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ToastService } from './services/toastr.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AuthService } from './services/auth.service';
import { asyncScheduler, distinctUntilChanged, fromEvent, map, throttleTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from './pages/header/header.component';
import { UtilityService } from './services/utility.service';
import { LucideAngularModule } from 'lucide-angular';
import { FooterComponent } from './pages/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, HeaderComponent, LucideAngularModule, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  toastService = inject(ToastService); _authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  showScrollButton = signal<boolean>(false);
  router = inject(Router);
  _utilityService = inject(UtilityService);
  constructor(@Inject(PLATFORM_ID) private platformId: Object, private ngZone: NgZone) { }


  scrollToTop(event?: Event) {
    if (isPlatformBrowser(this.platformId)) {
      if (event) {
        event.preventDefault(); // 3. Explicitly prevents the browser from rubber-banding
      }

      // if (isPlatformBrowser(this.platformId)) {
      //   window.scrollTo({
      //     top: 0,
      //     behavior: 'smooth'
      //   });
      // }
    }
  }

  ngOnInit(): void {

    // this.ngZone.runOutsideAngular(() => {
    //   if (isPlatformBrowser(this.platformId)) {
    //     fromEvent(window, 'scroll').pipe(
    //       throttleTime(100, asyncScheduler, { leading: true, trailing: true }),
    //       map(() => {
    //         const yOffset = window.scrollY || document.documentElement.scrollTop;
    //         return Math.max(0, yOffset) > 100;
    //       }),
    //       distinctUntilChanged(),
    //       takeUntilDestroyed(this.destroyRef)
    //     ).subscribe(isScrolled => {
    //       this.ngZone.run(() => {
    //         if (isPlatformBrowser(this.platformId)) {
    //           this.showScrollButton.set(isScrolled);
    //         }
    //       });

    //     });
    //   }
    // });

  }
}
