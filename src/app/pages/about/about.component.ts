
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { SeoService } from '../../services/seo.service';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports:[RouterModule,CommonModule,FormsModule]
})
export class AboutComponent {



  constructor(private seoService: SeoService, private meta: Meta) { }

  ngOnInit() {

    // this.seoService.updateSeoTags({
    //   title: 'About Mei Heal | Clinical Nutritionist',
    //   description: 'Learn about Mei Heal, her qualifications, and her philosophy of using sustainable, food-first approaches to manage weight, PCOS, and overall health.',
    //   url: 'https://www.meiheal.com/about',
    //   image: 'https://www.meiheal.com/images/drmeiheal.jpeg'
    // });



    // this.seoService.setStructuredData({
    //   "@context": "https://schema.org",
    //   "@type": "Person",
    //   "name": "meiheal",
    //   "url": "https://www.meiheal.com/about",
    //   "jobTitle": "Clinical Nutritionist &  Health Store ",
    //   "logo": "https://www.meiheal.com/images/dlogob.webp",
    //   "image": "https://www.meiheal.com/images/drmeiheal.jpeg",
    //   "description": "Learn about Mei Heal, her qualifications, and her philosophy of using sustainable, food-first approaches to manage weight, PCOS, and overall health.",
    //   "worksFor": {
    //     "@type": "MedicalBusiness",
    //     "name": "Mei Heal",
    //     "url": "https://www.meiheal.com",
    //     "logo": "https://www.meiheal.com/images/dlogob.webp",
    //     "telephone": "+91-9354999067",
    //     "areaServed": {
    //       "@type": "City",
    //       "name": "Delhi"
    //     }
    //   },
    //   "sameAs": [
    //     "https://www.facebook.com/profile.php?id=61590369990172",
    //     "https://instagram.com/dietwith_meiheal",
    //     "https://www.linkedin.com/in/meiheal",
    //     "https://www.youtube.com/@meiheal",
    //     "https://x.com/meiheal"
    //   ],
    // });



    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: 'About Mei Heal | Clinical Nutritionist'
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: 'Learn about Mei Heal, her qualifications, and her philosophy of using sustainable, food-first approaches to manage weight, PCOS, and overall health.'
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: 'https://www.meiheal.com/images/drmeiheal.jpeg'
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: 'https://www.meiheal.com/about'
    });

    this.meta.updateTag({
      name: 'twitter:site',
      content: '@meiheal'
    });

    this.meta.updateTag({
      name: 'twitter:creator',
      content: '@meiheal'
    });
  }
}
