import { CommonModule } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import { UtilityService } from "../../../services/utility.service";
import { AuthService } from "../../../services/auth.service";
import { of, Subject, takeUntil } from "rxjs";

@Component({
    selector: 'dashboard-mobile-menu',
    standalone: true, // The magic flag
    imports: [RouterLink, CommonModule],
    styles: [`
.mobile-popup {
  position: fixed;
  left: 0;
  width: 100vw;
  height: 100vh;
  padding-bottom: 64px;
  overflow-y: auto;
  z-index: 10;
}

.pt-50px {
  top: 50px;
}

.td-none {
  text-decoration: none;
}

.fs-inherit {
  font-size: inherit;
}

.flex-one-one {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
}
`],
    templateUrl: './dashboard-mobile-menu.component.html',
})
export class DashboardMobileMenuComponent {

    _utilityService = inject(UtilityService);
    isLoggingOut = signal<boolean>(false);
    public _authService = inject(AuthService);
    private destroy$ = new Subject<void>();
    router = inject(Router);
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
                    // Logout failed console
                    this._authService.purgeAuth(); // 🚀 The Safety Net
                    this._utilityService.closeAllDD();
                    this.isLoggingOut.set(false);
                    return of(null);

                }
            });
    }

    ngOnDestroy() {
        // this.scrollSubject.complete();
        this.destroy$?.next();
        this.destroy$?.complete();
    }
}