import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

declare let gtag: Function;

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    platformId = inject(PLATFORM_ID);
    constructor(router: Router) {
        router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe((event: any) => {
                if (isPlatformBrowser(this.platformId)) {

                    gtag('config', 'G-HHD8LTBVBM', {
                        page_path: event.urlAfterRedirects
                    });
                }

            });
    }
}