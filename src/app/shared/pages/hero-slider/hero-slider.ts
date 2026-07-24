import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-slider',
  standalone: true,
  templateUrl: './hero-slider.html',
  styleUrl: './hero-slider.css',
  imports:[CommonModule,RouterModule ,FormsModule],
})
export class HeroSliderComponent implements OnInit ,OnDestroy {
 activeIndex = 0;

 private intervalId!: number;

ngOnInit() {
  this.intervalId = window.setInterval(() => {
    this.next();
  }, 5000);
}

ngOnDestroy() {
  clearInterval(this.intervalId);
}

public  slides = [
    {
      desktopImage: '/banners/banner1.svg',
      mobileImage: '/banners/banner1.svg',
      link: '/products/healthsense-percussion-gun-massager-machine-for-full-body-pain-relief-for-men-women-2800-rpm-deep-tissue-massage-gun-with-speed-indicator-4-removable-heads-6-speed-levels-high-torque-motor-lightweight-with-non-slip-handle-hm140',
      overlayOpacity: 0,
      textColor: '#ffffff',
      desktopAlign: 'align-left',
      mobileAlign: 'mobile-align-center'
    },
    {
      desktopImage: '/banners/banner2.svg',
      mobileImage: '/banners/banner2.svg',
      link: '/products/2',
      overlayOpacity: 0,
      textColor: '#ffffff',
      desktopAlign: 'align-center',
      mobileAlign: 'mobile-align-center'
    },
    {
      desktopImage: '/banners/banner3.svg',
      mobileImage: '/banners/banner3.svg',
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