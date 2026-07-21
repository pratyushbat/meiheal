import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { UtilityService } from '../../services/utility.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare let gtag: Function;
@Component({
  selector: 'auth-layout',
  template: `    

<div class="md:grid grid-cols-2 w-full bg-warm-white-100 "  [ngClass]="{    'pt-16': !_utilityService.isAuthRoute()  }" >
  <div class="px-4 pb-40 pt-2">
    <div  class="mx-auto mw-470">
      <div class="flex md:pb-16 pb-8">
        <!-- <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 24" class="mt-4" width="70.85" height="32" arial-label="Kit logo"><path d="M14.551 9.987c6.538 1.266 8.567 7.321 8.62 13.412a.247.247 0 0 1-.246.249h-8.23a.247.247 0 0 1-.246-.246c-.025-4.725-.79-8.895-5.47-9.075a.247.247 0 0 0-.255.246v8.828c0 .137-.11.247-.247.247H.247A.246.246 0 0 1 0 23.4V.907C0 .771.11.66.246.66h8.231c.136 0 .247.11.247.247v8.426a.226.226 0 0 0 .442.067c2.12-6.948 6.08-8.696 12.51-8.739a.247.247 0 0 1 .248.247v8.405c0 .137-.11.247-.246.247h-7.086a.215.215 0 0 0-.04.427Zm38.555 12.04c0 .182-.1.35-.262.436C52.07 22.87 49.676 24 46.938 24c-5.632 0-9.771-2.334-9.85-8.746h-.003V9.806c0-.136.11-.246.246-.246h6.057a.216.216 0 0 0 .041-.428c-4.739-.94-6.927-3.67-7.002-8.225a.242.242 0 0 1 .242-.247h8.894c.136 0 .246.11.246.247V5.23c0 .136.11.247.246.247h5.82c.136 0 .246.11.246.246v3.59c0 .136-.11.247-.247.247h-5.819a.247.247 0 0 0-.246.246v4.395c0 1.552.951 2.064 2.216 2.064 1.983 0 3.938-.894 4.722-1.299a.246.246 0 0 1 .36.22v6.84ZM25.507 23.4V9.806c0-.136.11-.247.247-.247h8.23c.137 0 .247.11.247.247V23.4c0 .137-.11.247-.246.247h-8.231a.247.247 0 0 1-.247-.247Zm-.466-19.21c0 2.313 1.634 4.19 4.771 4.19 3.138 0 4.771-1.877 4.771-4.19C34.583 1.875 32.95 0 29.813 0c-3.138 0-4.772 1.876-4.772 4.19Z" fill="#1e1e1e"></path></svg> -->
          <a  [routerLink]="['/']"
            class="block focus-visible:ring-2 focus-visible:ring-blue-500 outline-hidden"
            aria-label="meiheal Logo - Navigate to homepage"
          >
            <svg  [ngClass]="{'mt-4': _utilityService.isAuthRoute() }"
              viewBox="0 0 80 25"
              width="80"
              height="25"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              role="img"
              aria-label="DWV"
            >
              <text
                x="1"
                y="21"
                font-family="Georgia, 'Times New Roman', serif"
                font-size="25"
                font-weight="bold"
                font-style="italic"
                letter-spacing="-1"
                fill="currentColor"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linejoin="round"
                paint-order="stroke fill"
              >
                DWV
              </text>
            </svg>
          </a>      
      </div>
      <div class="flex mb-6">
        <a  routerLink="/login"   routerLinkActive="border-b-2 font-semibold" [routerLinkActiveOptions]="{ exact: true }"
          class="block hover:no-underline no-underline  text-center w-1/2 border-b py-2 text-gray-900 border-gray-900"
        >
          Log in
        </a>
        <a
             routerLink="/signup"   routerLinkActive="border-b-2 font-semibold"
          class="hover:border-gray-500 hover:no-underline no-underline block text-center w-1/2 border-b py-2"
          >Create account</a
        >
      </div>
        <router-outlet></router-outlet>
    </div>
  </div>
  <aside
    class="hidden md:flex items-center justify-center min-h-full max-h-screen relative overflow-hidden"
  >
    <img
    src="/images/login-f.webp"
      alt="Auth Mei Heal"
      class="object-cover object-center min-h-full"
    />
    <div
      class="rounded-l rounded-br absolute bottom-0 right-0 mr-8 mb-8 h-20 w-40 p-4 flex flex-col bg-rone"
  
    >
      <span class="text-base pb-2 font-semibold">Mei Heal</span
      ><span class="italic"> Health Store </span>
    </div>
  </aside>
</div>

    
    `,
  styles: [`

        .mw-470{
        max-width: 470px
        }

        .bg-rone{
          background: rgba(238, 246, 243, 0.9)
        }
        `],
  standalone: true,
  imports:[RouterModule,CommonModule,FormsModule]
})
export class AuthLayoutComponent {
  _utilityService = inject(UtilityService);
}
