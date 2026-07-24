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
 
export interface TopPicksTab {
  key: string;      // e.g. 'tab1'
  label: string;    // e.g. 'Trending now'
  products: TopPicksProduct[];
}
@Component({
  selector: 'top-picks',
  standalone: true,
  templateUrl: './top-picks.html',
  styleUrl: './top-picks.css',
  imports:[CommonModule,RouterModule ,FormsModule],
})
export class TopPicksComponent  {
 /** Section heading, e.g. "Best seller" */
  @Input() title = '';
 
  /** Optional "view all" link */
  @Input() viewAllUrl = '';
 
  /** Tabs + the products that belong to each tab */
  @Input() tabs: TopPicksTab[] = [];
 
  /** Currently active tab key */
  activeTabKey = '';
 
  // One #slider per tab-content panel in the template;
  // this replaces `root.querySelectorAll('.top-picks__slider')`
  @ViewChildren('slider') sliders!: QueryList<ElementRef<HTMLElement>>;
 
  ngAfterViewInit(): void {
    if (this.tabs.length) {
      this.activeTabKey = this.tabs[0].key;
    }
  }
 
  /** Replaces the tab click handler + classList.add/remove('active') logic */
  setActiveTab(key: string): void {
    this.activeTabKey = key;
  }
 
  isActiveTab(key: string): boolean {
    return this.activeTabKey === key;
  }
 
  /** Replaces the prevBtn/nextBtn click handlers + slider.scrollBy(...) */
  scroll(direction: 'left' | 'right'): void {
    const activeIndex = this.tabs.findIndex((t) => t.key === this.activeTabKey);
    const sliderEl = this.sliders.toArray()[activeIndex]?.nativeElement;
    if (!sliderEl) {
      return;
    }
    const amount = sliderEl.clientWidth;
    sliderEl.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth'
    });
  }
}

