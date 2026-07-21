// core/services/product.service.ts
import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/core';
import { Observable, of, tap, catchError, map, shareReplay } from 'rxjs';
import { Product } from '../models/product.model';

export interface ProductListResponse {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ProductQuery {
  category?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  pageSize?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);

  private readonly API_BASE = '/api/products';

  // Signal-based state for components that prefer signals over async pipe
  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  totalCount = signal(0);

  // In-memory cache so navigating list -> detail -> back doesn't refetch
  private listCache = new Map<string, ProductListResponse>();
  private detailCache = new Map<string, Product>();

  /**
   * Fetch a paginated/filterable product list.
   * Uses TransferState so SSR-fetched data is reused on the client
   * instead of double-fetching after hydration.
   */
  /*  listCache/detailCache have no invalidation or TTL. They live forever (per session). If your product prices or stock change while the user browses, they'll see stale data until a hard refresh. In production you'd typically want a TTL, a manual invalidate() method (e.g., call after a mutation), or swap to something like Angular's httpResource/resource() (newer reactive primitives) or a library cache (RxJS interval-based invalidation, or TanStack Query-style stale-while-revalidate) for anything beyond a simple demo/MVP. */
  getProducts(query: ProductQuery = {}): Observable<ProductListResponse> {
    // console.log('query', query)
    const cacheKey = this.buildCacheKey(query);
    const stateKey = makeStateKey<ProductListResponse>(`products-${cacheKey}`);
    // console.log('ProductService getProducts cacheKey', cacheKey)
    // console.log('ProductService getProducts stateKey', stateKey)
    // console.log(' ProductService getProducts this.transferState.hasKey(', this.transferState.hasKey(stateKey))
    // console.log('ProductService getProducts this.transferState.get(stateKey)', this.transferState.get(stateKey, null as unknown as ProductListResponse))
    // console.log('ProductService getProducts this.listCache.has(cacheKey)', this.listCache.has(cacheKey))
    // console.log('ProductService getProducts this.listCache.get(cacheKey)', this.listCache.get(cacheKey))


    // Client: reuse data the server already fetched
    if (this.transferState.hasKey(stateKey)) {
      const cached = this.transferState.get(stateKey, null as unknown as ProductListResponse);
      this.transferState.remove(stateKey);
      this.products.set(cached.products);
      this.totalCount.set(cached.total);
      return of(cached);
    }

    if (this.listCache.has(cacheKey)) {
      const cached = this.listCache.get(cacheKey)!;
      this.products.set(cached.products);
      this.totalCount.set(cached.total);
      return of(cached);
    }

    this.loading.set(true);
    this.error.set(null);

    const params = this.buildParams(query);

    return this.http.get<ProductListResponse>(this.API_BASE + '', { params }).pipe(
      tap((res) => {
        this.products.set(res.products);
        this.totalCount.set(res.total);
        this.loading.set(false);
        this.listCache.set(cacheKey, res);

        if (isPlatformServer(this.platformId)) {
          // console.log('SSR:getProducts  setting transferState for', stateKey);
          this.transferState.set(stateKey, res);
        }
        // 1) listCache.set(), transferState.set()   [server-side memory] and ──> HTML + script tag sent to browser
      }),
      catchError((err) => {
        this.loading.set(false);
        this.error.set('Unable to load products. Please try again.');
        console.error('ProductService.getProducts failed', err);
        return of({ products: [], total: 0, page: 1, pageSize: 0 });
      }),
      shareReplay(1)
    );
  }

  /**
   * Fetch a single product by slug — used by the detail page resolver.
   */
  getBySlug(slug: string): Observable<Product | null> {
    const stateKey = makeStateKey<Product>(`product-${slug}`);

    // console.log('ProductService  getBySlug this.transferState.hasKey(', this.transferState.hasKey(stateKey))
    // console.log('ProductService getBySlug this.transferState.get(stateKey)', this.transferState.get(stateKey, null as unknown as Product))
    // console.log('ProductService getBySlugthis.detailCache.has(slug)', this.detailCache.has(slug))
    // console.log('ProductService getBySlug this.detailCache.get(slug)', this.detailCache.get(slug))
    if (this.transferState.hasKey(stateKey)) {
      const cached = this.transferState.get(stateKey, null as unknown as Product);
      this.transferState.remove(stateKey);
      this.detailCache.set(slug, cached);
      return of(cached);
    }

    if (this.detailCache.has(slug)) {
      return of(this.detailCache.get(slug)!);
    }

    return this.http.get<Product>(`${this.API_BASE}/slug/${slug}`).pipe(
      tap((product) => {
        this.detailCache.set(slug, product);
        if (isPlatformServer(this.platformId)) {
          // console.log('SSR: getBySlug setting transferState for', stateKey);
          this.transferState.set(stateKey, product);
        }
      }),
      catchError((err) => {
        console.error(`ProductService.getBySlug(${slug}) failed`, err);
        return of(null);
      })
    );
  }

  /**
   * Related products for the detail page ("You might also like").
   */
  getRelated(productId: string, category: string, limit = 4): Observable<Product[]> {
    const params = this.buildParams({ category, pageSize: limit });

    return this.http.get<ProductListResponse>(this.API_BASE, { params }).pipe(
      map((res) => res.products.filter((p) => p.id !== productId).slice(0, limit)),
      catchError(() => of([]))
    );
  }

  private buildParams(query: ProductQuery): Record<string, string> {
    const params: Record<string, string> = {};
    if (query.category) params['category'] = query.category;
    if (query.sortBy) params['sortBy'] = query.sortBy;
    if (query.minPrice !== undefined) params['minPrice'] = String(query.minPrice);
    if (query.maxPrice !== undefined) params['maxPrice'] = String(query.maxPrice);
    if (query.search) params['search'] = query.search;
    params['page'] = String(query.page ?? 1);
    params['pageSize'] = String(query.pageSize ?? 24);
    return params;
  }

  private buildCacheKey(query: ProductQuery): string {
    return JSON.stringify(query);
  }
}


/* 

════════════════════════════════════════════════════════════════
 T0 — Server receives GET /products?category=shoes
════════════════════════════════════════════════════════════════
  getProducts({category:'shoes'}) called
  transferState.hasKey()  → FALSE  (server, nothing set yet)
  listCache.has()         → FALSE  (fresh instance, this SSR request)
  ──> real HTTP call to backend
  ──> tap(): listCache.set(), transferState.set()   [server-side memory]
  ──> HTML rendered with data inline
  ──> Angular serializes transferState → <script id="ng-state">
  ──> HTML + script tag sent to browser


════════════════════════════════════════════════════════════════
 T1 — Browser paints server HTML instantly (user sees products)
════════════════════════════════════════════════════════════════
  (no Angular JS running yet — this is raw HTML)


════════════════════════════════════════════════════════════════
 T2 — Client JS bundle loads, Angular bootstraps (hydration)
════════════════════════════════════════════════════════════════
  Angular reads <script id="ng-state"> from DOM
  Deserializes JSON → populates CLIENT transferState store
  (script tag removed from DOM around here)

  NEW ProductService instance created (client-side)
    listCache = new Map()   ← EMPTY, brand new instance!
    detailCache = new Map() ← EMPTY

  ProductListComponent.ngOnInit() runs
  getProducts({category:'shoes'}) called AGAIN (same query!)

    ①  transferState.hasKey(stateKey) → TRUE  ✅
        (because Angular just repopulated it from the script tag)
        → transferState.remove(stateKey)  [consumed, gone forever]
        → returns of(cached) — NO http call, NO listCache write
        → listCache.has() line NEVER EVEN RUNS (early return above it)

  ⚠️ Notice: listCache is still EMPTY at this point!
     The transferState path returns before reaching the listCache
     check OR the tap() that would populate listCache.


════════════════════════════════════════════════════════════════
 T3 — User clicks a product → SPA route change → detail page
════════════════════════════════════════════════════════════════
  getBySlug('nike-air-max') called
  Same ProductService instance (singleton, still alive)
  transferState.hasKey() → FALSE (was never set for this slug
                             during THIS client bootstrap;
                             it only had list data, and even
                             that's already removed)
  detailCache.has() → FALSE (first time)
  ──> real HTTP call (first client-side network request)
  ──> tap(): detailCache.set('nike-air-max', product)


════════════════════════════════════════════════════════════════
 T4 — User clicks "Back" → returns to /products (SPA nav)
════════════════════════════════════════════════════════════════
  getProducts({category:'shoes'}) called AGAIN
  Same ProductService instance (still alive, never destroyed)

    ①  transferState.hasKey(stateKey) → FALSE
        (consumed at T2, never repopulated — TransferState is
         SSR-only, nothing sets it on the client)

    ②  listCache.has(cacheKey) → ???
        ⚠️ Still FALSE! Because at T2 the transferState branch
        returned early and NEVER wrote to listCache either.

  ──> falls through to REAL HTTP CALL (again!)
  ──> tap(): NOW listCache.set(cacheKey, res)  ✅ finally populated


════════════════════════════════════════════════════════════════
 T5 — User navigates away and back to /products AGAIN
════════════════════════════════════════════════════════════════
  getProducts({category:'shoes'}) called

    ①  transferState.hasKey() → FALSE (long gone)
    ②  listCache.has(cacheKey) → TRUE ✅  (set at T4!)
        → returns of(cached) — NO http call. Cache finally works.

*/