import { CommonModule } from '@angular/common';
import { AfterViewInit, Component,  ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
export interface TopPicksProduct {
  imagePrimary: string;
  imageSecondary?: string;
  title: string;
  url: string;
  currentPrice: string;
  oldPrice?: string;
  discount?: string;
  judgeMeId?: string;
}
 
export interface TribeProduct {
  id: number;
  title: string;
  video: string;
  thumbnail: string;
  currentPrice: string;
  oldPrice?: string;
  discount?: string;
}
@Component({
  selector: 'join-tribe',
  standalone: true,
  templateUrl: './join-tribe.html',
  styleUrl: './join-tribe.css',
  imports:[CommonModule,RouterModule ,FormsModule],
})
export class JoinTribeComponent  {
   @ViewChild('carousel', { static: false })
  carousel!: ElementRef<HTMLDivElement>;

  products = [
    {
      title: 'Vitamin C Face Wash',
      video: 'videos/video1.mp4',
      thumbnail: 'images/thumb1.png',
      currentPrice: '₹299',
      oldPrice: '₹399',
      discount: '25% OFF'
    },
    {
      title: 'Hair Growth Serum',
      video: 'videos/video2.mp4',
      thumbnail: 'images/thumb2.png',
      currentPrice: '₹499',
      oldPrice: '₹699',
      discount: '30% OFF'
    },
    {
      title: 'Sunscreen SPF 50',
      video: '/videos/video3.mp4',
      thumbnail: 'images/thumb3.png',
      currentPrice: '₹399',
      oldPrice: '₹499',
      discount: '20% OFF'
    },
    {
      title: 'Niacinamide Serum',
      video: '/videos/video4.mp4',
      thumbnail: 'images/thumb4.png',
      currentPrice: '₹599',
      oldPrice: '₹799',
      discount: '25% OFF'
    }
  ];

  scrollLeft(): void {
    this.carousel.nativeElement.scrollBy({
      left: -320,
      behavior: 'smooth'
    });
  }

  scrollRight(): void {
    this.carousel.nativeElement.scrollBy({
      left: 320,
      behavior: 'smooth'
    });
  }
 
}

