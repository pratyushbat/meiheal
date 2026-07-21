// features/product-detail/product-detail.resolver.ts
import { ResolveFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';

export const productDetailResolver: ResolveFn<Product | null> = (
    route: ActivatedRouteSnapshot
) => {
    const productService = inject(ProductService);
    const router = inject(Router);

    const slug = route.paramMap.get('slug');

    if (!slug) {
        router.navigate(['/404']);
        return of(null);
    }

    return productService.getBySlug(slug).pipe(
        tap((product) => {
            /*  console.log('productDetailResolver product', product)
             if (!product) {
                 router.navigate(['/404']);
             } */
        }),
        catchError((err) => {
            console.error(`productDetailResolver failed for slug "${slug}"`, err);
            router.navigate(['/404']);
            return of(null);
        })
    );
};