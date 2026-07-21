
import { Component, computed, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { SeoService } from '../../services/seo.service';
import { SingleBlogPost } from '../../models/blog.model';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';


@Component({
  selector: 'blogs-category-detail-category-detail',
  templateUrl: './blogs-category-detail.component.html',
  styleUrls: ['./blogs-category-detail.component.scss'],
  standalone: true,
  imports:[CommonModule,RouterModule]
})
export class BlogsCategoryDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  categoryId = this.route.snapshot.paramMap.get('category') ?? '';

  private router = inject(Router);
  isLoading: boolean = true;
  errorMessage: string = '';


  currentPage: number = 1;
  totalPages: number = 1;
  private data = toSignal(this.route.data, { requireSync: true });
  blogCatPag = computed(() => this.data().blogsinCat as SingleBlogPost | null);


  private readonly seoEffect = effect(() => {
    const blog = this.blogCatPag();
    this.callSeo(blog);
    if (!blog) return;

    this.callStructuredData(blog);
    this.changePageNumber(blog)
  });


  constructor(private seoService: SeoService, private _blogService: BlogService, private meta: Meta) { }

  ngOnInit(): void {



  }




  changePage(page: number) {
    if (page >= 1 && page <= (this.totalPages || 1) && page !== this.currentPage) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page },
        queryParamsHandling: 'merge',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }



  callSeo(singBlogPostCat: SingleBlogPost | null) {
    const catSlug = singBlogPostCat?.category?.slug;
    const canonicalUrl = catSlug
      ? `https://www.meiheal.com/blogs/${catSlug}`
      : `https://www.meiheal.com${this.router.url.split('?')[0]}`;
    // this.seoService.updateSeoTags({
    //   title: singBlogPostCat?.category?.seoTitle || 'Nutrition Blog by Dietitians',
    //   description: singBlogPostCat?.category?.seoDescription || 'Nutrition Blog by Dietitians ',
    //   url: singBlogPostCat?.category?.slug ? `https://www.meiheal.com/blogs/${singBlogPostCat?.category?.slug}` : `https://www.meiheal.com${this.router.url.split('?')[0]}`,
    //   image: singBlogPostCat?.category?.image || 'https://www.meiheal.com/images/peigtht.webp'
    // });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: singBlogPostCat?.category?.seoTitle || 'Nutrition Blog by Dietitians' });
    this.meta.updateTag({ name: 'twitter:description', content: singBlogPostCat?.category?.seoDescription || 'Nutrition Blog by Dietitians ' });
    this.meta.updateTag({ name: 'twitter:image', content: singBlogPostCat?.category?.image || 'https://www.meiheal.com/images/peigtht.webp' });
    this.meta.updateTag({ name: 'twitter:url', content: canonicalUrl });
    this.meta.updateTag({ name: 'twitter:site', content: '@meiheal' });
    this.meta.updateTag({ name: 'twitter:creator', content: '@meiheal' });
  }

  callStructuredData(singBlogPostCat: SingleBlogPost) {
    // this.seoService.setStructuredData({
    //   "@context": "https://schema.org",
    //   "@type": "CollectionPage",
    //   "name": singBlogPostCat?.category?.seoTitle || 'Nutrition Blog by Dietitians',
    //   "url": singBlogPostCat?.category?.slug ? `https://www.meiheal.com/blogs/${singBlogPostCat?.category?.slug}` : `https://www.meiheal.com${this.router.url.split('?')[0]}`,
    //   "image": singBlogPostCat?.category?.image || 'https://www.meiheal.com/images/peigtht.webp',
    //   "description": singBlogPostCat?.category?.seoDescription || 'Nutrition Blog by Dietitians ',
    //   "publisher": {
    //     "@type": "MedicalBusiness",
    //     "name": "Mei Heal",
    //     "logo": {
    //       "@type": "ImageObject",
    //       "url": "https://www.meiheal.com/images/dlogob.webp"
    //     },
    //     "url": "https://www.meiheal.com"
    //   },
    //   "mainEntity": {
    //     "@type": "ItemList",
    //     "name": singBlogPostCat?.category?.name || "Blog Posts",
    //     "itemListElement": singBlogPostCat?.posts.map((blog, index) => ({
    //       "@type": "ListItem",
    //       "position": index + 1,
    //       "url": singBlogPostCat?.category?.slug ? `https://www.meiheal.com/blogs/${singBlogPostCat?.category?.slug}/${blog.slug}` : `https://www.meiheal.com/blogs/${blog.slug}`,
    //       "name": blog.title
    //     }))
    //   }
    // });
  }

  changePageNumber(singBlogPostCat: SingleBlogPost) {
    if (singBlogPostCat?.pagination?.currentPage)
      this.currentPage = singBlogPostCat?.pagination?.currentPage ? singBlogPostCat?.pagination?.currentPage as number : 1;
    this.totalPages = singBlogPostCat?.pagination?.totalPages ? singBlogPostCat?.pagination?.totalPages as number : 1;
  }
  get pageNumbers(): number[] {
    return Array.from({ length: (this.totalPages || 1) }, (_, i) => i + 1);
  }

}
