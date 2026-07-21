
import { AfterViewInit, Component, HostListener, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toastr.service';
import { Subject, Subscription, take, takeUntil } from 'rxjs';
import { ModalService } from '../../../services/modal.service';
import { Meta } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';



@Component({
  selector: 'user-dashbboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.scss'],
  standalone: true,
  imports:[RouterModule]
})
export class UserDashboardComponent implements OnInit {
  // private sub = new Subscription();
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);
  _authService = inject(AuthService);
  private toast = inject(ToastService);
  // private modalService = inject(ModalService);
  isShow: boolean = false;
  topPosToStartShowing = 100;
  toggleSidebar: boolean = false;

  constructor(private meta: Meta) {
    this.meta.addTag({ name: 'robots', content: 'noindex' });
  }
  // ngAfterViewInit(): void {
  //   if (!isPlatformBrowser(this.platformId)) return;
  //   this.sub = this.modalService.toggleSBar$.subscribe(tt => {
  //     this.ontoggleSidebar(tt)
  //   })
  // }


  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.destroy$?.next();
    this.destroy$?.complete();
  }


  ontoggleSidebar(event?: any) {
    this.toggleSidebar = !this.toggleSidebar
  }

  onclickToggleSidebar() {
    if (this.toggleSidebar == true) {
      this.toggleSidebar = !this.toggleSidebar
    }
  }

  gotoTop() {
    if (isPlatformBrowser(this.platformId))
      window?.scroll({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
  }


  @HostListener('window:scroll')
  checkScroll() {
    const scrollPosition = document.documentElement.scrollTop || document.body.scrollTop || 0;

    if (scrollPosition >= this.topPosToStartShowing) {
      this.isShow = true;
    } else {
      this.isShow = false;
    }
  }


}
