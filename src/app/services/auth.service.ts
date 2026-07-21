import { UserRes } from './../models/user.model';

import { HttpClient } from '@angular/common/http';
import { computed, DOCUMENT, effect, inject, Inject, Injectable, makeStateKey, OnDestroy, PLATFORM_ID, signal, TransferState } from '@angular/core';
import { catchError, finalize, Observable, ObservableInput, of, shareReplay, Subject, take, takeUntil, tap, throwError, timeout } from 'rxjs';
import { RegisterRequest, User } from '../models/user.model';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
const USER_KEY = makeStateKey<any>('logged-user-data');
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);
  private destroy$ = new Subject<void>();

  currentUser = signal<User | null | undefined>(null);
  isLoggedIn = computed(() => !!this.currentUser());

  private loaded = false;
  private inflight$: Observable<UserRes | null> | null = null;


  logUserData() {
    if (this.loaded) return of(this.currentUser());

    // Hydration: consume the value the server already fetched
    if (isPlatformBrowser(this.platformId) && this.transferState.hasKey(USER_KEY)) {
      const user = this.transferState.get(USER_KEY, null);
      this.transferState.remove(USER_KEY);
      this.currentUser.set(user);
      (this.currentUser() as any).isGuest = false;
      this.loaded = true;
      return of(user);
    }


    if (!this.inflight$) {
      this.inflight$ = this.http.get<UserRes>('/api/user/getloggeduser').pipe(
        timeout(8000),
        tap((res: UserRes) => {
          this.currentUser.set(res?.userData ?? null);
          if (!!this.currentUser())
            (this.currentUser() as any).isGuest = false;
          // note:hardcode isguest
          this.loaded = true;
          if (!isPlatformBrowser(this.platformId)) {
            this.transferState.set(USER_KEY, res?.userData ?? null); // hand off to browser
          }
        }),
        catchError(() => {
          this.currentUser.set(null);
          this.loaded = true;
          return of(null);
        }),
        shareReplay(1),
        finalize(() => (this.inflight$ = null))
      );
    }
    return this.inflight$;


  }

  /* Summary of the rule: any place your auth state can change (login, logout, token refresh, "update profile" if it affects role/permissions) should call refreshUser(), and refreshUser() must reset both loaded and inflight$ before re-fetching — otherwise you'll serve cached pre-login state to guards that fire right after. */
  /** Call after login/logout, or whenever you need a fresh user from the API */
  refreshUser(): Observable<User | null> {
    this.loaded = false;
    this.inflight$ = null;
    // also clear any stale TransferState leftover from SSR, just in case
    if (this.transferState.hasKey(USER_KEY)) {
      this.transferState.remove(USER_KEY);
    }
    return this.logUserData();
  }

  setAuthenticatedUser(user: User) {
    this.currentUser.set(user);
    this.loaded = true;
  }


  purgeAuth() {
    this.loaded = false;
    this.inflight$ = null;
    this.currentUser.set(null);
  }

  logoutUser() {
    return this.http.post('/api/user/logOut', {}, { withCredentials: true }).pipe(
      tap(() => this.purgeAuth()),
      catchError(() => {
        this.purgeAuth();
        return of(null);
      })
    );
  }
  resetPasswordPP(body: Partial<any>): Observable<any> {
    return this.http.post('/api/user/resetPdPP', body);
  }

  signUpUser(body: Partial<RegisterRequest>): Observable<any> {
    return this.http.post('/api/user/signup', body);
  }

  loginemail(password: string, email: string) {
    return this.http.post("/api/user/login", { password, email });
  }


  upgradeTempTokenAccount(token: any, newPassword: any) {
    return this.http.post('/api/user/setPassword', { token, newPassword });
  }

  sendresetPwdAccountMail(email: any) {
    return this.http.post('/api/user/forgetPwd', { email });
  }

  resetPwdAccount(token: any, newPassword: any, confirm_password: any) {
    return this.http.post('/api/user/resetPassword', { token, new_password: newPassword, confirm_password });
  }

  verifyUserAccountMail(email: any) {
    return this.http.post('/api/user/veriyUserMail', { email });
  }
  verifyUserAccount(code: any) {
    return this.http.post('/api/user/verifyUser', { code });
  }



  ngOnDestroy(): void {
    this.destroy$?.next();
    this.destroy$?.complete();
  }


}
