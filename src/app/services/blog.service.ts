import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { catchError, Observable, of, shareReplay, tap } from 'rxjs';
import { BlogCategory, BlogPost, SingleBlogPost } from '../models/blog.model';
import { isPlatformServer } from '@angular/common';


const BLOG_CATEGORIES_STATE_KEY = makeStateKey<BlogCategory[]>('blog-categories-all');
@Injectable({
  providedIn: 'root'
})
export class BlogService {


  private apiUrl = '/api/blogs';
  private platformId = inject(PLATFORM_ID);
  private transferState = inject(TransferState);
  // In-memory cache: survives SPA nav away/back to /blogs within the same session
  private categoriesCache: BlogCategory[] | null = null;
  // Keyed by "categorySlug:page" — mirrors the ProductService listCache pattern
  private categoryPostsCache = new Map<string, SingleBlogPost>();
  // Keyed by "categorySlug:postSlug"
  private singlePostCache = new Map<string, BlogPost>();

  constructor(private http: HttpClient) { }


  createCategory(categoryData: Partial<BlogCategory>): Observable<BlogCategory> {
    return this.http.post<BlogCategory>(`${this.apiUrl}/category`, categoryData);
  }

  createPost(postData: Partial<BlogPost>): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.apiUrl}/post`, postData);
  }


  getAllCategories(): Observable<BlogCategory[]> {

    // 1. Client, post-hydration: reuse what the server already fetched
    if (this.transferState.hasKey(BLOG_CATEGORIES_STATE_KEY)) {
      const cached = this.transferState.get(BLOG_CATEGORIES_STATE_KEY, [] as BlogCategory[]);
      this.transferState.remove(BLOG_CATEGORIES_STATE_KEY);
      this.categoriesCache = cached;   // seed in-memory cache too — closes the gap we found earlier
      return of(cached);
    }

    // 2. Client, SPA nav back to /blogs later: reuse in-memory cache
    if (this.categoriesCache) {
      return of(this.categoriesCache);
    }


    return this.http.get<BlogCategory[]>(`${this.apiUrl}`).pipe(
      tap((res) => {
        this.categoriesCache = res;
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(BLOG_CATEGORIES_STATE_KEY, res);
        }
      }),
      catchError((err) => {
        console.error('BlogService.getAllCategories failed', err);
        return of([]);
      }),
      shareReplay(1)
    );
  }

  getCategoryWithPosts(categorySlug: string, page: number = 1): Observable<any> {
    const cacheKey = `${categorySlug}:${page}`;
    const stateKey = makeStateKey<SingleBlogPost>(`blog-category-${cacheKey}`);

    // 1. Client, post-hydration: reuse what the server already fetched
    if (this.transferState.hasKey(stateKey)) {
      const cached = this.transferState.get(stateKey, null as unknown as SingleBlogPost);
      this.transferState.remove(stateKey);
      this.categoryPostsCache.set(cacheKey, cached);
      return of(cached);
    }

    // 2. Client, SPA nav back to this category/page later: reuse in-memory cache
    if (this.categoryPostsCache.has(cacheKey)) {
      return of(this.categoryPostsCache.get(cacheKey)!);
    }

    // 3. Real HTTP call
    let params = new HttpParams();
    if (page) params = params.set('page', String(page));

    return this.http.get<SingleBlogPost>(`${this.apiUrl}/${categorySlug}`, { params }).pipe(
      tap((res) => {
        this.categoryPostsCache.set(cacheKey, res);
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(stateKey, res);
        }
      }),
      catchError((err) => {
        console.error(`BlogService.getCategoryWithPosts(${categorySlug}, page=${page}) failed`, err);
        throw err; // let the resolver's catchError handle navigation to /404
      }),
      shareReplay(1)
    );
  }

  getSinglePost(categorySlug: string, postSlug: string): Observable<any> {
    const cacheKey = `${categorySlug}:${postSlug}`;
    const stateKey = makeStateKey<BlogPost>(`blog-post-${cacheKey}`);

    // 1. Client, post-hydration: reuse what the server already fetched
    if (this.transferState.hasKey(stateKey)) {
      const cached = this.transferState.get(stateKey, null as unknown as BlogPost);
      this.transferState.remove(stateKey);
      this.singlePostCache.set(cacheKey, cached);
      return of(cached);
    }

    // 2. Client, SPA nav back to this exact post: reuse in-memory cache
    if (this.singlePostCache.has(cacheKey)) {
      return of(this.singlePostCache.get(cacheKey)!);
    }

    // 3. Real HTTP call
    return this.http.get<BlogPost>(`${this.apiUrl}/${categorySlug}/${postSlug}`).pipe(
      tap((res) => {
        this.singlePostCache.set(cacheKey, res);
        if (isPlatformServer(this.platformId)) {
          this.transferState.set(stateKey, res);
        }
      }),
      catchError((err) => {
        console.error(`BlogService.getSinglePost(${categorySlug}, ${postSlug}) failed`, err);
        throw err; // resolver's catchError handles the /404 redirect
      }),
      shareReplay(1)
    );
  }

  getCommentsForBlog(blogId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${blogId}/comments`);
  }

  addComment(blogId: string, content: string,
    authorName: string,
    parentCommentId: string | null = null): Observable<Comment> {
    const payload = {
      content,
      authorName,
      parentComment: parentCommentId
    };
    return this.http.post<Comment>(`${this.apiUrl}/${blogId}/comments`, payload);
  }



}
