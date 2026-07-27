import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, inject, OnDestroy, OnInit, PLATFORM_ID, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  templateUrl: './hero-slider.html',
  styleUrl: './hero-slider.css',
  imports: [CommonModule, RouterModule, FormsModule],
})
export class HeroSliderComponent implements OnInit, OnDestroy {
  activeIndex = 0;

  private intervalId!: number;
  platformId = inject(PLATFORM_ID)

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.intervalId = window.setInterval(() => {
        this.next();
      }, 5000);
    }
  }

  ngOnDestroy() {
    clearInterval(this.intervalId);
  }

  public slides = [
    {
      desktopImage: 'https://res.cloudinary.com/jwrnfsov/image/upload/v1785140425/products/aralzlrhix86oemz60pj.png',
      mobileImage: 'https://res.cloudinary.com/jwrnfsov/image/upload/v1785140553/products/ckcmo1hynbrh6s7sqb4s.png',
      link: '/products/-machine-for-full-body-pain-relief-for-men-women-2800-rpm-deep-tissue-massage-gun-with-speed-indicator-4-removable-heads-6-speed-levels-high-torque-motor-lightweight-with-non-slip-handle-hm140',
      overlayOpacity: 0,
      textColor: '#ffffff',
      desktopAlign: 'align-left',
      mobileAlign: 'mobile-align-center'
    },
    {
      desktopImage: 'https://res.cloudinary.com/jwrnfsov/image/upload/v1785140612/products/a4rwmauash9clopaaqlp.png',
      mobileImage: 'https://res.cloudinary.com/jwrnfsov/image/upload/v1785140716/products/vxmcz1xsasww7kzidhi1.png',
      link: '/products/2',
      overlayOpacity: 0,
      textColor: '#ffffff',
      desktopAlign: 'align-center',
      mobileAlign: 'mobile-align-center'
    },
    {
      desktopImage: 'https://res.cloudinary.com/jwrnfsov/image/upload/v1785140425/products/aralzlrhix86oemz60pj.png',
      mobileImage: 'https://res.cloudinary.com/jwrnfsov/image/upload/v1785140553/products/ckcmo1hynbrh6s7sqb4s.png',
      link: '/products/3',
      overlayOpacity: 0,
      textColor: '#ffffff',
      desktopAlign: 'align-right',
      mobileAlign: 'mobile-align-center'
    }
  ];

  next() {
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
  }

  prev() {
    this.activeIndex =
      (this.activeIndex - 1 + this.slides.length) % this.slides.length;
  }

  goTo(index: number) {
    this.activeIndex = index;
  }

}