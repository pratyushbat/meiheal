import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformServer, Location } from '@angular/common';
import { catchError, EMPTY, from, of, switchMap, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { API_URL } from '../../../backend/config/constants';



export const ssrApiInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const authService = inject(AuthService);
  const location = inject(Location);
  const apiUrl = inject(API_URL);

  let apiReq = req;

  if (!req.url.startsWith('http')) {
    const cleanBaseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
    const cleanReqUrl = req.url.startsWith('/') ? req.url : `/${req.url}`;
    apiReq = req.clone({ url: `${cleanBaseUrl}${cleanReqUrl}` });
    // console.log('cleanBaseUrl/cleanReqUrl', `${cleanBaseUrl}${cleanReqUrl}`)
  }

  const bypassedUrls = [
    /\/api\/payment\/.*/,
    /\/api\/product\/.*/,
    /\/api\/lead\/.*/,
  ];


  const isBypassed = bypassedUrls.some(pattern => pattern.test(req.url));
  if (isPlatformServer(platformId)) {
    // inject(REQUEST) request from the browser to your server
    // This is the raw Node/Express-level request object representing what the visiting browser originally sent to your server — the actual headers the browser included 
    const serverRequest = inject(REQUEST) as any;
    // serverRequest.headers   // the browser's original headers — e.g{ cookie: "jwtAutToken=abc123", ... 

    // apiReq.headers — the outgoing HTTP request your Angular app is about to make
    // your Angular app is constructing to send onward, to your own backend AP
    // // Angular HttpRequest's headers — initially whatever the calling code set, likely empty/minima
    let headers = apiReq.headers;
    if (serverRequest?.headers) {
      Object.keys(serverRequest.headers).forEach(key => {
        const lowerKey = key.toLowerCase();
        const isForbidden =
          lowerKey === 'host' ||
          lowerKey === 'forwarded' ||
          lowerKey === 'connection' ||
          lowerKey === 'content-length';

        if (!isForbidden) {
          headers = headers.set(key, serverRequest.headers[key]);
        }
      });
    }

    const secureReq = apiReq.clone({ headers });
    return next(secureReq);
  }

  return next(apiReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isPlatformServer(platformId) && error.status === 401) {
        // console.warn(`[SSR WARNING] Ignored 401 on server for: ${req.url}`);
        // return EMPTY;
        return of(null as any);
      }
      if (error.status === 401) {
        const currentPath = location.path();
        const protectedRoutes = ['/dashboard'];
        const isProtectedPage = protectedRoutes.some(route => currentPath.startsWith(route));
        if (!isProtectedPage || isBypassed) {
          return throwError(() => error);
        }
        authService.purgeAuth();
        // console.log('401 INTERCEPTOR', { currentPath, requestUrl: req.url });
        return throwError(() => error);
      }
      return throwError(() => error);
    })
  );
}




