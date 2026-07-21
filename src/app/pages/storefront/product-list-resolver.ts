import { ResolveFn, ActivatedRouteSnapshot, Router, ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { catchError, of, tap } from 'rxjs';
import { ProductListResponse, ProductQuery, ProductService } from '../../services/product.service';

export const productListResolver: ResolveFn<ProductListResponse | null> = (route: ActivatedRouteSnapshot) => {
    const productService = inject(ProductService);
    const qp = route.queryParamMap;
    const query: ProductQuery = {
        category: qp.get('category') ?? undefined,
        sortBy: (qp.get('sortBy') as ProductQuery['sortBy']) ?? undefined,
        minPrice: qp.get('minPrice') ? Number(qp.get('minPrice')) : undefined,
        maxPrice: qp.get('maxPrice') ? Number(qp.get('maxPrice')) : undefined,
        search: qp.get('search') ?? undefined,
        page: qp.get('page') ? Number(qp.get('page')) : undefined,
        pageSize: qp.get('pageSize') ? Number(qp.get('pageSize')) : undefined,
    };
    return productService.getProducts(query).pipe(
        catchError(() => of(null))
    );
};
