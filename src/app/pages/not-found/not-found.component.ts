
import { isPlatformServer } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss'],
  standalone: true,
  imports:[RouterModule]
})
export class NotfoundComponent implements OnInit {
  private meta = inject(Meta);
  private platformId = inject(PLATFORM_ID);


  ngOnInit(): void {
    this.meta.addTag({ name: 'robots', content: 'noindex' });
    if (isPlatformServer(this.platformId)) {
      this.meta.addTag({ name: 'custom-ssr-status', content: '404' });
      this.meta.addTag({ name: 'dr-status-one', content: '404' });
    }


  }
}
