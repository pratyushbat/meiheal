
import { Component, inject, OnInit } from '@angular/core';
import { SeoService } from '../../services/seo.service';


@Component({
  selector: 'health-calculator',
  templateUrl: './health-calculator.component.html',
  styleUrls: ['./health-calculator.component.scss'],
  standalone: false
})
export class HealthCalculatorComponent implements OnInit {



  private seoService = inject(SeoService);

  constructor() { }


  ngOnInit(): void {
 /*    this.seoService.updateSeoTags({
      title: 'Free Health Calculators | BMI, BMR, Calorie & Ideal Weight Calculator',
      description:
        'Use our free health calculators to calculate BMI, BMR, daily calorie needs, ideal body weight and more. Get accurate results and expert nutrition guidance from Mei Heal.',
      url: 'https://www.meiheal.com/health-calculator',
      image: 'https://www.meiheal.com/ptwo.webp'
    });

    this.seoService.setStructuredData({
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Free Health Calculators | BMI, BMR & Calorie Calculator",
      "url": "https://www.meiheal.com/health-calculator",
      "description": "Use free health calculators to calculate your BMI, BMR, daily calorie requirements, ideal body weight and other important health metrics.",

      "publisher": {
        "@type": "MedicalBusiness",
        "name": "Mei Heal",
        "url": "https://www.meiheal.com",
        "telephone": "+91-9354999067",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.meiheal.com/images/dlogob.webp"
        }
      },

      "image": {
        "@type": "ImageObject",
        "url": "https://www.meiheal.com/ptwo.webp",
        "width": 1200,
        "height": 630
      },

      "mainEntity": {
        "@type": "ItemList",
        "name": "Health Calculators",
        "itemListElement": [

        ]
      },

      "about": {
        "@type": "MedicalWebPage",
        "name": "Health Calculators",
        "description": "Online nutrition and health assessment calculators to estimate body mass index, calorie needs and ideal body weight."
      },

      "inLanguage": "en-IN"
    }); */
  }





}
