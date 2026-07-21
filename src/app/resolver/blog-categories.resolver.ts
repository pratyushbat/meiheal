import { inject, PLATFORM_ID } from '@angular/core';

import { ActivatedRouteSnapshot, ResolveFn, Router, RouterStateSnapshot } from '@angular/router';

import { BlogService } from '../services/blog.service';
import { catchError, EMPTY } from 'rxjs';




export const blogCategoriesResolver: ResolveFn<any> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const _blogService = inject(BlogService);
    const router = inject(Router);
    const categoryId = route.paramMap.get('category')!;
    const page = route.queryParamMap.get('page') ? Number(route.queryParamMap.get('page')) : 1;
    return _blogService.getCategoryWithPosts(categoryId, page).pipe(
        catchError(() => {
            router.navigate(['/404'], { skipLocationChange: true });
            return EMPTY;
        })
    );
};

export const blogDetailResolver: ResolveFn<any> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
) => {
    const _blogService = inject(BlogService);
    const router = inject(Router);
    const currentPostSlug = route.paramMap.get('slug')!;
    const categoryISlug = route.paramMap.get('category')!;
    const platformId = inject(PLATFORM_ID);
    return _blogService.getSinglePost(categoryISlug, currentPostSlug).pipe(
        catchError(error => {
            router.navigate(['/404'], { skipLocationChange: true });
            return EMPTY;
        })
    );
};