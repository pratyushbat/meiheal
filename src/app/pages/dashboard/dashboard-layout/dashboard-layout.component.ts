
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';

import { Meta } from '@angular/platform-browser';
import { SeoService } from '../../../services/seo.service';
import { DashboardMobileMenuComponent } from '../dashboard-mobile-menu/dashboard-mobile-menu.component';
import { CartDrawerComponent } from '../../storefront/storefront-cart-drawer/cart-drawer.component';
import { RouterModule } from '@angular/router';
// import { DHeaderComponent } from '../dash-header/dash-header.component';


@Component({
  selector: 'dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.scss'],
  standalone: true,
  imports:[DashboardMobileMenuComponent,CartDrawerComponent,RouterModule]
})
export class DashboardLayoutComponent {



  constructor(private seoService: SeoService, private meta: Meta) { }

  ngOnInit() {

  }
}
