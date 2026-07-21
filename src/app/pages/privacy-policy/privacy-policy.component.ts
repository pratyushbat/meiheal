
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { SeoService } from '../../services/seo.service';
import { Meta } from '@angular/platform-browser';


@Component({
  selector: 'privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  standalone: false
})
export class PrivacypolicyComponent implements OnInit {

  title: string = 'Privacy Policy | Mei Heal';
  description: string = `Read Mei Heal's Privacy Policy to understand how we collect, use, protect, and store your personal information when you use our website,  Health Store plans, and consultation services.`;
  url: string = 'https://www.meiheal.com/privacy-policy';
  image: string = 'https://www.meiheal.com/landingth.webp';
  constructor(private seoService: SeoService, private meta: Meta) {
  }

  ngOnInit(): void {
  /*   this.seoService.updateSeoTags({
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
      "dateModified": "2026-06-29",
      "description": "Privacy policy for Mei Heal, outlining how we protect your personal health information.",
      "publisher": {
        "@type": "MedicalBusiness",
        "name": "Mei Heal",
        "url": "https://www.meiheal.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.meiheal.com/images/dlogob.webp"
        }
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
