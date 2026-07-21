
import { inject, PLATFORM_ID } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);

    if (route.routeConfig?.path === '**')
        return true;

    return authService.logUserData().pipe(
        map(user => (user ? true : router.parseUrl('/login')))
    );

};


