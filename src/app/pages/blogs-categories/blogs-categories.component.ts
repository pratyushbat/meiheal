
import { Component, effect, inject, OnInit, PLATFORM_ID, Signal, signal } from '@angular/core';
import { SeoService } from '../../services/seo.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BlogCategory } from '../../models/blog.model';
import { BlogService } from '../../services/blog.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';


@Component({
  selector: 'blogs-categories',
  templateUrl: './blogs-categories.component.html',
  styleUrls: ['./blogs-categories.component.scss'],
  standalone: true,
  imports:[CommonModule,FormsModule,ReactiveFormsModule,RouterModule]
})
export class BlogsCategoriesComponent implements OnInit {



  private meta = inject(Meta);
  private seoService = inject(SeoService);
  private _blogService = inject(BlogService);

  readonly categories = toSignal(
    this._blogService.getAllCategories(),
    {
      initialValue: []
    }
  );

  isLoading: boolean = true;
  errorMessage: string = '';

  private readonly structuredDataEffect = effect(() => {
    const categories = this.categories();
    this.callSeo();
    if (!categories.length) return;

    this.callSeoStructtureData(categories);
  });



  ngOnInit(): void {

  }



  callSeo() {

    // this.seoService.updateSeoTags({
    //   title: 'MeiHeal blogs: Health Insights, Symptoms & Care Tips',
    //   description: 'Explore expert-written MeiHeal blogs on nutrition,debunking nutrition myths , healthy eating, symptoms, causes, diagnosis, treatment options, prevention tips.',
    //   url: `https://www.meiheal.com/blogs`,
    //   image: 'https://www.meiheal.com/landingth.webp'
    // });




    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: 'MeiHeal blogs: Health Insights, Symptoms & Care Tips'
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: 'Explore expert-written MeiHeal blogs on nutrition,debunking nutrition myths , healthy eating, symptoms, causes, diagnosis, treatment options, prevention tips.'
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: 'https://www.meiheal.com/landingth.webp'
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: `https://www.meiheal.com/blogs`
    });

    // Optional
    this.meta.updateTag({
      name: 'twitter:site',
      content: '@meiheal'
    });

    this.meta.updateTag({
      name: 'twitter:creator',
      content: '@meiheal'
    });
  }
  callSeoStructtureData(categories: BlogCategory[]) {

    // this.seoService.setStructuredData({
    //   "@context": "https://schema.org",
    //   "@type": "CollectionPage",
    //   "name": "MeiHeal blogs: Health Insights, Symptoms & Care Tips",
    //   "url": `https://www.meiheal.com/blogs`,
    //   "image": "https://www.meiheal.com/images/landingth.webp",
    //   "description": "Explore expert-written MeiHeal blogs on nutrition,debunking nutrition myths , healthy eating, symptoms, causes, diagnosis, treatment options, prevention tips.",
    //   "publisher": {
    //     "@type": "MedicalBusiness",
    //     "name": "Mei Heal",
    //     "url": "https://www.meiheal.com",
    //     "logo": {
    //       "@type": "ImageObject",
    //       "url": "https://www.meiheal.com/images/dlogob.webp"
    //     }
    //   },
    //   "mainEntity": {
    //     "@type": "ItemList",
    //     "name": "Blog Categories",
    //     "itemListElement": categories.map((cat, index) => ({
    //       "@type": "ListItem",
    //       "position": index + 1,
    //       "name": cat.name,
    //       "url": `https://www.meiheal.com/blogs/${cat.slug}`
    //     }))
    //   }
    // });
  }



}
