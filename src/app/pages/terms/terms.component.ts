
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { SeoService } from '../../services/seo.service';
import { Meta } from '@angular/platform-browser';


@Component({
  selector: 'terms',
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
  standalone: false
})
export class TermsComponent {
  title: string = 'Terms & Conditions | Mei Heal';
  description: string = `Read the Terms & Conditions for Mei Heal's website,  Health Store plans, online consultations, payments, cancellations, refunds, and use of our nutrition services.`;
  url: string = 'https://www.meiheal.com/terms';
  image: string = 'https://www.meiheal.com/landingth.webp';
  constructor(private seoService: SeoService, private meta: Meta) {
  }

  ngOnInit(): void {
   /*  this.seoService.updateSeoTags({
      title: this.title,
      description: this.description,
      url: this.url,
      image: this.image
    });


    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": this.title,
      "url": this.url,
      "description": this.description,
      "publisher": {
        "@type": "MedicalBusiness",
        "name": "Mei Heal",
        "url": "https://www.meiheal.com"
      }
    }); */

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: this.title
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: this.description
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: this.image
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: 'https://www.meiheal.com/'
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

}
