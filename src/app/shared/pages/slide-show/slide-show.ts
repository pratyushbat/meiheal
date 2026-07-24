import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, ElementRef, HostListener, Input, OnDestroy, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
export interface HeroSlide {
  /** Desktop / default image */
  imageDesktop: string;
  /** Optional mobile image, shown under the max-width breakpoint */
  imageMobile?: string;
  alt?: string;
  width?: number;
  height?: number;
}
 
@Component({
  selector: 'app-slide-show',
  standalone: true,
  templateUrl: './slide-show.html',
  styleUrl: './slide-show.css',
  imports:[CommonModule,RouterModule ,FormsModule],
})
export class SlideShowComponent implements OnInit ,OnDestroy {
 @Input() slides: HeroSlide[] = [];
 
  /** Enable/disable autoplay */
  @Input() autoplay = true;
 
  /** Autoplay delay per slide, in ms */
  @Input() autoplayDelay = 5000;
 
  @ViewChildren('slideEl') slideEls!: QueryList<ElementRef<HTMLDivElement>>;
  @ViewChild('paginationContainer') paginationContainer?: ElementRef<HTMLDivElement>;
 
  currentSlide = 0;
  private autoplayTimer: any = null;
  private isTransitioning = false;
  private touchStartX = 0;
  private touchEndX = 0;
 
  ngOnInit(): void {}
 
  ngAfterViewInit(): void {
    if (this.slides.length === 0) {
      return;
    }
    // Kick off the pagination animation for the first slide
    this.restartPaginationAnimation();
 
    if (this.autoplay && this.slides.length > 1) {
      this.startAutoplay();
    }
  }
 
  ngOnDestroy(): void {
    this.stopAutoplay();
  }
 
  // ---- Navigation -------------------------------------------------------
 
  nextSlide(): void {
    const nextIndex = (this.currentSlide + 1) % this.slides.length;
    this.goToSlide(nextIndex);
  }
 
  previousSlide(): void {
    const prevIndex = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.goToSlide(prevIndex);
  }
 
  goToSlide(index: number): void {
    if (index === this.currentSlide || this.isTransitioning) {
      return;
    }
    this.stopAutoplay();
    this.showSlide(index);
    if (this.autoplay) {
      this.startAutoplay();
    }
  }
 
  private showSlide(index: number): void {
    this.isTransitioning = true;
    this.currentSlide = index;
    this.restartPaginationAnimation();
 
    setTimeout(() => {
      this.isTransitioning = false;
    }, 800);
  }
 
  // ---- Pagination progress animation -------------------------------------
 
  private restartPaginationAnimation(): void {
    // Reset then re-trigger the CSS animation on the active pagination line
    // by toggling a class on next tick.
    setTimeout(() => {
      const active = this.paginationContainer?.nativeElement.querySelector(
        '.ai-premium-hero-pagination-line.active'
      ) as HTMLElement | null;
      if (active) {
        active.style.setProperty('--slide-duration', `${this.autoplayDelay / 1000}s`);
        active.classList.remove('animating');
        // Force reflow so the animation restarts
        void active.offsetWidth;
        active.classList.add('animating');
      }
    });
  }
 
  // ---- Autoplay -----------------------------------------------------------
 
  private startAutoplay(): void {
    this.stopAutoplay();
    this.autoplayTimer = setTimeout(() => {
      this.nextSlide();
    }, this.autoplayDelay);
  }
 
  private stopAutoplay(): void {
    if (this.autoplayTimer) {
      clearTimeout(this.autoplayTimer);
      this.autoplayTimer = null;
    }
  }
 
  onMouseEnter(): void {
    this.stopAutoplay();
  }
 
  onMouseLeave(): void {
    if (this.autoplay) {
      this.startAutoplay();
    }
  }
 
  // ---- Touch swipe --------------------------------------------------------
 
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }
 
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }
 
  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;
 
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.nextSlide();
      } else {
        this.previousSlide();
      }
    }
  }
 
  // ---- Keyboard -----------------------------------------------------------
 
  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.previousSlide();
    } else if (event.key === 'ArrowRight') {
      this.nextSlide();
    }
  }
 
  trackBySlide(index: number): number {
    return index;
  }
}