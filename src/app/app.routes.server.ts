import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. PRERENDER: Best for static pages (Home, About, Contact). 
  // Built once during deployment. Ultra-fast and perfect for SEO.
  { path: '', renderMode: RenderMode.Prerender },
  // { path: 'contactus', renderMode: RenderMode.Prerender },
  // { path: 'about', renderMode: RenderMode.Prerender },
  // { path: 'terms', renderMode: RenderMode.Prerender },
  // { path: 'privacy-policy', renderMode: RenderMode.Prerender },
  // { path: 'diet-plans', renderMode: RenderMode.Prerender },
  // { path: 'health-calculator', renderMode: RenderMode.Prerender },
  // { path: 'faq', renderMode: RenderMode.Prerender },

  // Auth pages
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'signup', renderMode: RenderMode.Client },
  { path: 'forget', renderMode: RenderMode.Client },

  // Dashboard
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'dashboard/**', renderMode: RenderMode.Client },

  // 3. SERVER: Best for dynamic content that needs SEO (Blogs, Service Details).
  // Built freshly on the server every time a user visits.
  // { path: 'blogs', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60' } },
  // { path: 'blogs/:category', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60' } },
  // { path: 'blogs/:category/:slug', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60' } },

  // { path: 'products', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=60' } },
  // { path: 'products/:slug', renderMode: RenderMode.Server, headers: { 'Cache-Control': 'no-store' } },


  // 2. CLIENT: Best for private or highly interactive pages (Dashboards, Login).
  // Runs entirely in the user's browser. SEO doesn't matter here.
  // { path: 'order-detail/:slug', renderMode: RenderMode.Client },
  { path: 'checkout', renderMode: RenderMode.Client, headers: { 'Cache-Control': 'no-store' } },
  // { path: 'setup-password', renderMode: RenderMode.Client },

  // { path: 'payment-success/:id', renderMode: RenderMode.Client },
  // { path: 'payment-failure', renderMode: RenderMode.Client },

  // 4. CATCH-ALL: Handles 404 pages or anything not explicitly defined above.
  // MUST BE LAST IN THE ARRAY.

  {
    path: '**',
    renderMode: RenderMode.Server,
    status: 404,
    headers: { 'Cache-Control': 'no-store' }
  }
];
