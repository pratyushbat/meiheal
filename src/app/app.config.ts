import { ApplicationConfig, ErrorHandler, importProvidersFrom, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { API_URL } from '../../backend/config/constants';
import { environment } from '../environments/environment';
import { ChunkErrorHandler } from '../../backend/config/chunk-error-handdler';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { ssrApiInterceptor } from './interceptor/ssr-api.interceptor';
import { AuthService } from './services/auth.service';
import { firstValueFrom } from 'rxjs';
import { LucideAngularModule, Home, Phone, ArrowUp, CircleX, FolderCode, ShoppingCart, Wallet, BadgeCheck, BadgeDollarSign, Gem, Sparkles, Crown, Hospital, Globe, SendHorizontal, Users, Medal, MapPin, User, Heart, Salad, ChartLine, MessageCircleDashed, Package, Timer, Search, Menu, X, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-angular';
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    {
      provide: API_URL,
      useValue: environment.apiUrl,
    },
    { provide: ErrorHandler, useClass: ChunkErrorHandler },
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({ Home, Phone, ArrowUp, CircleX, FolderCode, ShoppingCart, Wallet, BadgeCheck, BadgeDollarSign, Gem, Sparkles, Crown, Hospital, Globe, SendHorizontal, Users, Medal, MapPin, User, Heart, Salad, ChartLine, MessageCircleDashed, Package, Timer, Search, Menu, X, ChevronLeft, ChevronRight, ArrowRight })),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([ssrApiInterceptor]), withXsrfConfiguration({ /* if you use XSRF */ })),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return firstValueFrom(auth.logUserData());
    })
  ]
};
