import { Component, inject, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Router, RouterModule } from '@angular/router';
import { RegisterRequest, User } from '../../../models/user.model';
import { AlertService } from '../../../services/alert.service';
import { AuthService } from '../../../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { SeoService } from '../../../services/seo.service';
import { CartService } from '../../../services/cart.service';
declare let gtag: Function;
@Component({
  selector: 'app-signup',
  template: `
    <div class="mx-auto mw-470">
      <div class="flex flex-col items-center">
        <h2 class="css-7tfc0v leafygreen-ui-oaqrgz" data-testid="login-page-header">
          Sign up to your account
        </h2>     
        <div class="flex justify-center">
          <button
            onclick="window.location.href = '/google'"
            data-lgid="lg-button"
            type="button"
            class="lg-ui-button-0000 leafygreen-ui-7o0bky css-1j7yzl5"
            aria-disabled="false"
          >
            <div class="leafygreen-ui-v038xi"></div>
            <div class="leafygreen-ui-16tr4y">
              <div class="css-1molcjf">
                <svg width="52" height="52" role="img">
                  <title>Google's Logo</title>
                  <g
                    id="Google-Button"
                    stroke="none"
                    stroke-width="1"
                    fill="none"
                    fill-rule="evenodd"
                  >
                    <rect x="0" y="0" width="52" height="52" rx="2"></rect>
                    <g
                      id="logo_googleg_48dp"
                      transform="translate(13.65, 13.65) scale(1.4300000000000002)"
                    >
                      <path
                        d="M17.64,9.20454545 C17.64,8.56636364 17.5827273,7.95272727 17.4763636,7.36363636 L9,7.36363636 L9,10.845 L13.8436364,10.845 C13.635,11.97 13.0009091,12.9231818 12.0477273,13.5613636 L12.0477273,15.8195455 L14.9563636,15.8195455 C16.6581818,14.2527273 17.64,11.9454545 17.64,9.20454545 L17.64,9.20454545 Z"
                        id="Shape"
                        fill="#4285F4"
                      ></path>
                      <path
                        d="M9,18 C11.43,18 13.4672727,17.1940909 14.9563636,15.8195455 L12.0477273,13.5613636 C11.2418182,14.1013636 10.2109091,14.4204545 9,14.4204545 C6.65590909,14.4204545 4.67181818,12.8372727 3.96409091,10.71 L0.957272727,10.71 L0.957272727,13.0418182 C2.43818182,15.9831818 5.48181818,18 9,18 L9,18 Z"
                        id="Shape"
                        fill="#34A853"
                      ></path>
                      <path
                        d="M3.96409091,10.71 C3.78409091,10.17 3.68181818,9.59318182 3.68181818,9 C3.68181818,8.40681818 3.78409091,7.83 3.96409091,7.29 L3.96409091,4.95818182 L0.957272727,4.95818182 C0.347727273,6.17318182 0,7.54772727 0,9 C0,10.4522727 0.347727273,11.8268182 0.957272727,13.0418182 L3.96409091,10.71 L3.96409091,10.71 Z"
                        id="Shape"
                        fill="#FBBC05"
                      ></path>
                      <path
                        d="M9,3.57954545 C10.3213636,3.57954545 11.5077273,4.03363636 12.4404545,4.92545455 L15.0218182,2.34409091 C13.4631818,0.891818182 11.4259091,0 9,0 C5.48181818,0 2.43818182,2.01681818 0.957272727,4.95818182 L3.96409091,7.29 C4.67181818,5.16272727 6.65590909,3.57954545 9,3.57954545 L9,3.57954545 Z"
                        id="Shape"
                        fill="#EA4335"
                      ></path>
                      <path d="M0,0 L18,0 L18,18 L0,18 L0,0 Z" id="Shape"></path>
                    </g>
                  </g>
                </svg>
                <div (click)="googleSignupClick()" data-testid="displayText" class="css-1yvuomv">
                  <a href="/google" id="user_google_log_in">Continue with Google </a>
                </div>
              </div>
            </div>
          </button>
        </div>
        <div class="css-go0pt5" data-testid="line-divider">
          <span class="css-11sl9z4">Or with email and password</span>
        </div>
      </div>
      <form [formGroup]="signUpForm" (ngSubmit)="signUpForm.valid && signup()">
        <div class="mb-4">
          <label for="name" class="flex">
            <div class="pb-2 font-semibold pr-px">First Name</div>
            <div class="text-orange-500">*</div></label
          >
          <input
            formControlName="firstName"
            type="text"
            placeholder="First Name"
            class="required w-full h-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            [ngClass]="{
              'border-red-500 focus:ring-red-500':
                signUpForm.get('firstName')?.invalid && signUpForm.get('firstName')?.touched,
              'border-gray-200':
                !signUpForm.get('firstName')?.invalid || !signUpForm.get('firstName')?.touched,
            }"
          />
          <div
            *ngIf="signUpForm.get('firstName')?.invalid && signUpForm.get('firstName')?.touched"
            class="validator-error"
          >
            First Name is required
          </div>
        </div>
        <div class="mb-4">
          <label for="name" class="flex">
            <div class="pb-2 font-semibold pr-px">Last Name</div>
            <div class="text-orange-500">*</div></label
          >
          <input
            formControlName="lastName"
            type="text"
            placeholder="First Name"
            class="required w-full h-10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            [ngClass]="{
              'border-red-500 focus:ring-red-500':
                signUpForm.get('lastName')?.invalid && signUpForm.get('lastName')?.touched,
              'border-gray-200':
                !signUpForm.get('lastName')?.invalid || !signUpForm.get('lastName')?.touched,
            }"
          />
          <div
            *ngIf="signUpForm.get('lastName')?.invalid && signUpForm.get('lastName')?.touched"
            class="validator-error"
          >
            Last Name is required
          </div>
        </div>
        <div class="mb-4">
          <label for="emailAddress" class="flex"
            ><div class="pb-2 font-semibold pr-px">Phone</div>
            <div class="text-orange-500">*</div>
          </label>
          <input
            formControlName="phone"
            type="text"
            placeholder="phone"
            class="required w-full h-10 focus focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            [ngClass]="{
              'border-red-500 focus:ring-red-500':
                signUpForm.get('phone')?.invalid && signUpForm.get('phone')?.touched,
              'border-gray-200':
                !signUpForm.get('phone')?.invalid || !signUpForm.get('phone')?.touched,
            }"
          />
          <div
            *ngIf="signUpForm.get('phone')?.invalid && signUpForm.get('phone')?.touched"
            class="validator-error"
          >
            Phone is required
          </div>
        </div>
        <div class="mb-4">
          <label for="emailAddress" class="flex"
            ><div class="pb-2 font-semibold pr-px">Email</div>
            <div class="text-orange-500">*</div>
          </label>
          <input
            formControlName="email"
            type="email"
            placeholder="Email"
            class="required w-full h-10 focus focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            [ngClass]="{
              'border-red-500 focus:ring-red-500':
                signUpForm.get('email')?.invalid && signUpForm.get('email')?.touched,
              'border-gray-200':
                !signUpForm.get('email')?.invalid || !signUpForm.get('email')?.touched,
            }"
          />
          <div
            *ngIf="signUpForm.get('email')?.invalid && signUpForm.get('email')?.touched"
            class="validator-error"
          >
            Valid Email is required
          </div>
        </div>
        <div class="mb-4">
          <div>
            <div>
              <label for="password" class="flex">
                <div class="pb-2 font-semibold pr-px">Password</div>
                <div class="text-orange-500">*</div></label
              >
              <div
                class="required w-full h-10 border-gray-200 hover:border-gray-300 focus:outline-blue flex text-sm border rounded px-3 py-2 w-full bg-white border-gray-200 focus:outline-blue"
              >
                <input
                  formControlName="password"
                  [type]="hidePassword ? 'password' : 'text'"
                  placeholder="Password"
                  class="w-full focus:outline-none design-input"
                  [ngClass]="{
                    'border-red-500 focus:ring-red-500':
                      signUpForm.get('password')?.invalid && signUpForm.get('password')?.touched,
                    'border-gray-200':
                      !signUpForm.get('password')?.invalid || !signUpForm.get('password')?.touched,
                  }"
                />

                <div class="text-gray-700 whitespace-pre flex items-center pl-2">
                  <button
                    (click)="hidePassword = !hidePassword"
                    type="button"
                    aria-pressed="false"
                    aria-controls="password"
                    class="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    <span class="sr-only">Show password</span>
                    @if (hidePassword) {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        class="fill-current inline-block overflow-visible w-4 h-4 fs-inherit"
                        name="view"
                        role="img"
                      >
                        <path
                          d="M12 16.57q1.87 0 3.19-1.31c1.32-1.31 1.31-1.94 1.31-3.19q0-1.87-1.31-3.19C13.88 7.56 13.25 7.57 12 7.57q-1.87 0-3.19 1.31C7.5 10.2 7.5 10.82 7.5 12.07q0 1.87 1.31 3.19c1.31 1.32 1.94 1.31 3.19 1.31m0-1.8a2.6 2.6 0 0 1-1.91-.79 2.6 2.6 0 0 1-.79-1.91q0-1.13.79-1.91A2.6 2.6 0 0 1 12 9.37q1.13 0 1.91.79.8.78.79 1.91c-.01 1.13-.26 1.39-.79 1.91a2.6 2.6 0 0 1-1.91.79m0 4.8q-3.35 0-6.11-1.8a13 13 0 0 1-4.36-4.75 2 2 0 0 1-.2-1.44 2 2 0 0 1 .2-.46 13 13 0 0 1 4.36-4.75q2.76-1.8 6.11-1.8t6.11 1.8 4.37 4.75a2 2 0 0 1 .18 1.44 2 2 0 0 1-.18.46 13 13 0 0 1-4.37 4.75 11 11 0 0 1-6.11 1.8m0-2a9.5 9.5 0 0 0 5.19-1.49 10 10 0 0 0 3.61-4.01 10 10 0 0 0-3.61-4.01A9.6 9.6 0 0 0 12 6.57a9.6 9.6 0 0 0-5.19 1.49 10 10 0 0 0-3.61 4.01 10 10 0 0 0 3.61 4.01A9.5 9.5 0 0 0 12 17.57"
                        ></path>
                      </svg>
                    } @else {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        class="fill-current inline-block overflow-visible w-4 h-4 fs-inherit"
                        name="view-off"
                        role="img"
                      >
                        <path
                          d="M15.18 8.9a4.5 4.5 0 0 1 1.06 1.65q.33.92.24 1.9 0 .38-.28.63a1 1 0 0 1-.65.27 1 1 0 0 1-.64-.27 1 1 0 0 1-.26-.63q.13-.65-.08-1.25a3 3 0 0 0-.62-1.03 3 3 0 0 0-1.02-.65q-.6-.22-1.28-.1a1 1 0 0 1-.64-.27 1 1 0 0 1-.26-.65q0-.38.26-.64a1 1 0 0 1 .64-.26 4 4 0 0 1 1.87.23 4.5 4.5 0 0 1 1.65 1.07M12 6.57q-.47 0-.92.04-.45.03-.9.14a1 1 0 0 1-.77-.13 1 1 0 0 1-.46-.6 1 1 0 0 1 .09-.77q.2-.37.61-.45A9 9 0 0 1 12 4.57q3.42 0 6.26 1.8a12 12 0 0 1 4.34 4.85 2 2 0 0 1 .2.85q0 .23-.04.44a2 2 0 0 1-.14.41q-.45 1-1.1 1.88-.68.87-1.47 1.6a.8.8 0 0 1-.7.22 1 1 0 0 1-.65-.4 1 1 0 0 1-.21-.76q.04-.41.34-.69a10 10 0 0 0 1.97-2.7 10 10 0 0 0-3.61-4.01A9.6 9.6 0 0 0 12 6.57m0 13q-3.35 0-6.12-1.81A13 13 0 0 1 1.5 13a2 2 0 0 1-.19-.44 2 2 0 0 1-.06-.49q0-.24.05-.47t.18-.45q.5-1 1.16-1.92.66-.9 1.51-1.66l-2.08-2.1a1 1 0 0 1-.26-.71 1 1 0 0 1 .29-.69 1 1 0 0 1 .7-.27q.42 0 .7.27l17 17q.27.28.29.69a1 1 0 0 1-.29.71 1 1 0 0 1-.7.28 1 1 0 0 1-.7-.28l-3.5-3.45a12 12 0 0 1-3.6.55M5.55 8.97a11 11 0 0 0-1.32 1.43 9 9 0 0 0-1.03 1.67 10 10 0 0 0 3.61 4.01A9.5 9.5 0 0 0 12 17.57q.5 0 .98-.06l.97-.14-.9-.95q-.27.08-.53.11l-.52.04a4.3 4.3 0 0 1-3.19-1.31 4.4 4.4 0 0 1-1.16-4.24z"
                        ></path>
                      </svg>
                    }
                  </button>
                </div>
              </div>
              <div
                *ngIf="signUpForm.get('password')?.invalid && signUpForm.get('password')?.touched"
                class="validator-error"
              >
                (8-12 digit) Password is required
              </div>
            </div>
          </div>
        </div>
        <div class="mb-4">
          <div>
            <div>
              <label for="confirm_password" class="flex">
                <div class="pb-2 font-semibold pr-px">Confirm Password</div>
                <div class="text-orange-500">*</div></label
              >
              <div
                class="required w-full h-10 border-gray-200 hover:border-gray-300 focus:outline-blue flex text-sm border rounded px-3 py-2 w-full bg-white border-gray-200 focus:outline-blue"
              >
                <input
                  formControlName="confirm_password"
                  [type]="hideConPassword ? 'password' : 'text'"
                  placeholder="confirm password"
                  class="w-full focus:outline-none design-input"
                  [ngClass]="{
                    'border-red-500 focus:ring-red-500':
                      signUpForm.get('confirm_password')?.invalid &&
                      signUpForm.get('confirm_password')?.touched,
                    'border-gray-200':
                      !signUpForm.get('confirm_password')?.invalid ||
                      !signUpForm.get('confirm_password')?.touched,
                  }"
                />

                <div class="text-gray-700 whitespace-pre flex items-center pl-2">
                  <button
                    (click)="hideConPassword = !hideConPassword"
                    type="button"
                    aria-pressed="false"
                    aria-controls="confirm_password"
                    class="flex items-center text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
                  >
                    <span class="sr-only">Show confirm password</span>
                    @if (hideConPassword) {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        class="fill-current inline-block overflow-visible w-4 h-4 fs-inherit"
                        name="view"
                        role="img"
                      >
                        <path
                          d="M12 16.57q1.87 0 3.19-1.31c1.32-1.31 1.31-1.94 1.31-3.19q0-1.87-1.31-3.19C13.88 7.56 13.25 7.57 12 7.57q-1.87 0-3.19 1.31C7.5 10.2 7.5 10.82 7.5 12.07q0 1.87 1.31 3.19c1.31 1.32 1.94 1.31 3.19 1.31m0-1.8a2.6 2.6 0 0 1-1.91-.79 2.6 2.6 0 0 1-.79-1.91q0-1.13.79-1.91A2.6 2.6 0 0 1 12 9.37q1.13 0 1.91.79.8.78.79 1.91c-.01 1.13-.26 1.39-.79 1.91a2.6 2.6 0 0 1-1.91.79m0 4.8q-3.35 0-6.11-1.8a13 13 0 0 1-4.36-4.75 2 2 0 0 1-.2-1.44 2 2 0 0 1 .2-.46 13 13 0 0 1 4.36-4.75q2.76-1.8 6.11-1.8t6.11 1.8 4.37 4.75a2 2 0 0 1 .18 1.44 2 2 0 0 1-.18.46 13 13 0 0 1-4.37 4.75 11 11 0 0 1-6.11 1.8m0-2a9.5 9.5 0 0 0 5.19-1.49 10 10 0 0 0 3.61-4.01 10 10 0 0 0-3.61-4.01A9.6 9.6 0 0 0 12 6.57a9.6 9.6 0 0 0-5.19 1.49 10 10 0 0 0-3.61 4.01 10 10 0 0 0 3.61 4.01A9.5 9.5 0 0 0 12 17.57"
                        ></path>
                      </svg>
                    } @else {
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        class="fill-current inline-block overflow-visible w-4 h-4 fs-inherit"
                        name="view-off"
                        role="img"
                      >
                        <path
                          d="M15.18 8.9a4.5 4.5 0 0 1 1.06 1.65q.33.92.24 1.9 0 .38-.28.63a1 1 0 0 1-.65.27 1 1 0 0 1-.64-.27 1 1 0 0 1-.26-.63q.13-.65-.08-1.25a3 3 0 0 0-.62-1.03 3 3 0 0 0-1.02-.65q-.6-.22-1.28-.1a1 1 0 0 1-.64-.27 1 1 0 0 1-.26-.65q0-.38.26-.64a1 1 0 0 1 .64-.26 4 4 0 0 1 1.87.23 4.5 4.5 0 0 1 1.65 1.07M12 6.57q-.47 0-.92.04-.45.03-.9.14a1 1 0 0 1-.77-.13 1 1 0 0 1-.46-.6 1 1 0 0 1 .09-.77q.2-.37.61-.45A9 9 0 0 1 12 4.57q3.42 0 6.26 1.8a12 12 0 0 1 4.34 4.85 2 2 0 0 1 .2.85q0 .23-.04.44a2 2 0 0 1-.14.41q-.45 1-1.1 1.88-.68.87-1.47 1.6a.8.8 0 0 1-.7.22 1 1 0 0 1-.65-.4 1 1 0 0 1-.21-.76q.04-.41.34-.69a10 10 0 0 0 1.97-2.7 10 10 0 0 0-3.61-4.01A9.6 9.6 0 0 0 12 6.57m0 13q-3.35 0-6.12-1.81A13 13 0 0 1 1.5 13a2 2 0 0 1-.19-.44 2 2 0 0 1-.06-.49q0-.24.05-.47t.18-.45q.5-1 1.16-1.92.66-.9 1.51-1.66l-2.08-2.1a1 1 0 0 1-.26-.71 1 1 0 0 1 .29-.69 1 1 0 0 1 .7-.27q.42 0 .7.27l17 17q.27.28.29.69a1 1 0 0 1-.29.71 1 1 0 0 1-.7.28 1 1 0 0 1-.7-.28l-3.5-3.45a12 12 0 0 1-3.6.55M5.55 8.97a11 11 0 0 0-1.32 1.43 9 9 0 0 0-1.03 1.67 10 10 0 0 0 3.61 4.01A9.5 9.5 0 0 0 12 17.57q.5 0 .98-.06l.97-.14-.9-.95q-.27.08-.53.11l-.52.04a4.3 4.3 0 0 1-3.19-1.31 4.4 4.4 0 0 1-1.16-4.24z"
                        ></path>
                      </svg>
                    }
                  </button>
                </div>
              </div>
              <div
                *ngIf="
                  signUpForm.get('confirm_password')?.invalid &&
                  signUpForm.get('confirm_password')?.touched
                "
                class="validator-error"
              >
                (8-12 digit) confirm password is required
              </div>
            </div>
          </div>
        </div>
        <div class="mb-4">
          <div>
            <div>
              <div class="ck-checkbox ck-checkbox--horizontal pt-2">
                <input class="required" id="tocAccepted" type="checkbox" /><label
                  for="tocAccepted"
                  aria-label="Label Spacing"
                  >&nbsp;</label
                >
                <label class="control-label ck-checkbox__label  text-xs" for="tocAccepted"
                  >I have read and agree to Mei Heal's
                  <a
                    routerLink="/terms"
                    rel="noreferrer"
                    class="border-b border-gray-100 hover:border-gray-500 hover:no-underline"
                    >terms of service</a
                  >
                  and
                  <a
                    routerLink="/privacy-policy"
                    rel="noreferrer"
                    class="border-b border-gray-100 hover:border-gray-500 hover:no-underline"
                    >privacy policy</a
                  >.</label
                >
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          class="w-full leading-6 border border-solid border-transparent no-underline font-sans font-semibold transition duration-200 hover:no-underline focus:no-underline focus:outline-none  px-5 h-12 rounded-lg align-middle text-center inline-flex items-center justify-center text-sm py-3 focus:outline-blue"
          [ngClass]="
            !signUpForm.valid
              ? 'cursor-default text-gray-600 bg-gray-100 '
              : 'cursor-pointer text-gray-900 hover:text-black bg-blue-500 hover:bg-blue-400'
          "
          [disabled]="!signUpForm.valid"
        >
          Get started
        </button>
      </form>
    </div>
  `,
  styles: [
    `
      .mw-470 {
        max-width: 470px;
      }

      .design-input {
        color: var(--gray-800) !important;
        border: 0 !important;
        padding: 0 !important;
        font-size: 14px !important;
      }

      
.h-custom-google {
  height: 2.5rem;
  width: 2.5rem;
}

.leafygreen-ui-7o0bky {
  appearance: none;
  padding: 0px;
  margin: 0px;
  margin-top: 0px;
  border: 1px solid rgb(136, 147, 151);
  display: inline-flex;
  -moz-box-align: stretch;
  align-items: stretch;
  transition: 150ms ease-in-out;
  position: relative;
  text-decoration: none;
  cursor: pointer;
  z-index: 0;
  font-family: 'Euclid Circular A', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  border-radius: 6px;
  background-color: rgb(249, 251, 250);
  color: rgb(0, 30, 43);
  font-size: 16px;
  line-height: 28px;
  transform: translateY(1px);
  font-weight: 500;
  height: 36px;
}
@media only screen and (min-width: 1025px) {
  .css-1j7yzl5 {
    width: 296px;
  }
}
.css-1j7yzl5 {
  background-color: rgb(255, 255, 255);
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  margin-top: 16px;
  border-radius: 6px;
  width: 296px;
  height: 52px;
  box-shadow: lightgray 0px 1px;
}

.css-1j7yzl5:hover,
.css-1j7yzl5:focus {
  box-shadow: rgb(232, 236, 235) 0px 0px 0px 3px;
  border-color: rgb(136, 147, 151);
}
.leafygreen-ui-7o0bky:hover,
.leafygreen-ui-7o0bky[data-hover='true'],
.leafygreen-ui-7o0bky:active,
.leafygreen-ui-7o0bky[data-active='true'] {
  color: rgb(0, 30, 43);
  background-color: rgb(255, 255, 255);
  box-shadow: rgb(232, 237, 235) 0px 0px 0px 3px;
}
.leafygreen-ui-7o0bky:active,
.leafygreen-ui-7o0bky[data-active='true'],
.leafygreen-ui-7o0bky:focus,
.leafygreen-ui-7o0bky:hover {
  text-decoration: none;
}
.leafygreen-ui-v038xi {
  overflow: hidden;
  position: absolute;
  inset: 0px;
  border-radius: 5px;
}
.leafygreen-ui-7o0bky {
  cursor: pointer;
  font-family: 'Euclid Circular A', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: rgb(0, 30, 43);
  font-size: 16px;
  line-height: 28px;
  font-weight: 500;
}

.leafygreen-ui-7o0bky:hover,
.leafygreen-ui-7o0bky[data-hover='true'],
.leafygreen-ui-7o0bky:active,
.leafygreen-ui-7o0bky[data-active='true'] {
  color: rgb(0, 30, 43);
}

.leafygreen-ui-16tr4y {
  display: grid;
  grid-auto-flow: column;
  -moz-box-pack: center;
  justify-content: center;
  -moz-box-align: center;
  align-items: center;
  height: 100%;
  width: 100%;
  position: relative;
  user-select: none;
  z-index: 0;
  padding: 0px 11px;

  gap: 6px;
}

.css-1molcjf {
  display: flex;
  flex-direction: row;
  -moz-box-align: center;
  align-items: center;
  height: auto;
}

.css-1yvuomv {
  color: rgb(92, 108, 117);
  padding-right: 14px;
}

.css-11sl9z4 {
  font-size: 13px;
  line-height: 16px;
  font-weight: normal;
  color: rgb(92, 108, 117);
  text-align: center;
}
.css-go0pt5 {
  display: flex;
  -moz-box-align: center;
  align-items: center;
  width: 300px;
  margin: 20px 0px;
}
.css-go0pt5::before {
  margin-left: 0px;
}
.css-go0pt5::before,
.css-go0pt5::after {
  content: '';
  flex: 1 1 10%;
  border-bottom: 1px solid rgb(193, 199, 198);
  margin: 0px 10px;
  margin-left: 10px;
  transform: translateY(-50%);
}

.css-7tfc0v {
  margin-top: 32px;
  margin-bottom: 16px;
}
.leafygreen-ui-oaqrgz {
  margin: unset;
  margin-top: unset;
  margin-bottom: unset;
  font-size: 32px;
  line-height: 40px;
  font-weight: 400;
  font-family: 'MongoDB Value Serif', 'Times New Roman', serif;
  color: rgb(0, 104, 74);
}

.lh-br {
  line-height: 22px;
  border-radius: 7px;
}

.mt-2px {
  margin-top: 2px;
}

    `,
  ],
  standalone: true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterModule]
})
export class SignupComponent implements OnInit {
  hidePassword: boolean = true;
  hideConPassword: boolean = true;
  signUpForm: FormGroup;
  loading: boolean = false;
  user!: User;
  private seoService = inject(SeoService);
  private _cartService = inject(CartService);

  constructor(
    private _authService: AuthService,
    private alertService: AlertService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    this.signUpForm = new FormGroup({
      email: new FormControl(null, [Validators.required, Validators.email]),
      password: new FormControl(null, [
        Validators.required,
        Validators.maxLength(12),
        Validators.minLength(8),
      ]),
      confirm_password: new FormControl(null, [Validators.required]),
      phone: new FormControl(null, [Validators.required]),
      firstName: new FormControl(null, [Validators.required]),
      lastName: new FormControl(null, [Validators.required]),
    });
  }

  ngOnInit(): void {
    // this.seoService.updateSeoTags({
    //   title: 'Signup',
    //   description: 'Signup',
    //   url: `https://www.meiheal.com/login`,
    //   robots: 'noindex,nofollow',
    // });
  }

  googleSignupClick() {
    if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
      gtag('event', 'google_signup_click');
  }

  signup() {
    if (this.signUpForm.invalid) return;

    const formData = this.signUpForm.getRawValue();

    const apiPayload: Partial<RegisterRequest> = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      role: formData.role,
      password: formData.password,
      confirm_password: formData.confirm_password,
    };

    this.loading = true;

    this._authService.signUpUser(apiPayload).subscribe(
      (data) => {
        this.loading = false;
        this.alertService.success('Signup Successful.');
        this._cartService.syncCartFromServer();
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'signup_click');

        this.router.navigate(['login']);
      },
      (error) => {
        this.loading = false;
        console.log(error);
      },
    );
  }

  login() {
    this.router.navigate(['']);
  }
}
