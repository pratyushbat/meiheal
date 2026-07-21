import { ComponentRef, EnvironmentInjector, Injectable, OnDestroy, Type, ViewChild, ViewContainerRef } from '@angular/core';
import { Subject } from 'rxjs';
import { LoginComponent } from '../pages/auth/login/login.component';
import { SignupComponent } from '../pages/auth/sgnup/signup.component';

@Injectable({
  providedIn: 'root'
})
export class ModalService {

  private currentRef?: ComponentRef<any>;

  private open$ = new Subject<Type<any>>();
  private close$ = new Subject<void>();
  openRequests$ = this.open$.asObservable();
  closeRequests$ = this.close$.asObservable();
  private toggleSB$ = new Subject<Type<any>>();
  toggleSBar$ = this.toggleSB$.asObservable();
  constructor() { }



  open(host: ViewContainerRef, component: Type<any>, injector: EnvironmentInjector) {

    this.close();
    this.currentRef = host.createComponent(component, {
      environmentInjector: injector
    });
    return this.currentRef;
  }

  close() {
    this.currentRef?.destroy();
    this.currentRef = undefined;
  }
  requestOpen(component: Type<any>) {
    this.open$.next(component);
  }

  requestClose() {
    this.close$.next();
  }
  toggleSidebar(t: any) {
    this.toggleSB$.next(t);
  }
  openloginOrSignup(type: string) {
    if (type === 'login')
      this.requestOpen(LoginComponent);
    else if (type === 'signup')
      this.requestOpen(SignupComponent);
  }

}
