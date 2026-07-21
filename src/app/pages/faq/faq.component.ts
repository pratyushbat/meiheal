
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { SeoService } from '../../services/seo.service';
import { Meta } from '@angular/platform-browser';


@Component({
  selector: 'faq',
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
  standalone: false
})
export class FaqComponent {


  constructor(private seoService: SeoService, private meta: Meta) { }

  ngOnInit() {

  /*   this.seoService.updateSeoTags({
      title: "Frequently Asked Questions | Mei Heal ",
      description: "Who is a Registered Dietitian? What can a dietitian do for you? What is a dietitian? What's the difference between a nutritionist and a dietitian.",
      url: "https://www.meiheal.com/faq",
      image: "https://www.meiheal.com/images/drmeiheal.jpeg"
    });



    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "name": "Frequently Asked Questions | Mei Heal",
      "url": "https://www.meiheal.com/faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How much weight can I expect to lose with a personalized plan?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Many clients begin noticing measurable progress within..."
          }
        },
        {
          "@type": "Question",
          "name": "How many sessions does it take to see results?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": " The number of sessions needed varies from person..."
          }
        }
      ],
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
      content: "Registered dietitian nutritionist FAQ | Ask the Dietitian- FAQs | FAQ Mei Heal | Questions|"
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: "Who is a Registered Dietitian? What can a dietitian do for you? What is a dietitian? What's the difference between a nutritionist and a dietitian."
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: "https://www.meiheal.com/images/drmeiheal.jpeg"
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: "https://www.meiheal.com/faq"
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
