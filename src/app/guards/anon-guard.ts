import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';


export const anonGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const authService = inject(AuthService);
    if (route.routeConfig?.path === '**')
        return true;

    return authService.logUserData().pipe(
        map(user => (user ? router.parseUrl('/dashboard') : true))
    );
};