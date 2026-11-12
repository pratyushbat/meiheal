import { afterNextRender, ChangeDetectorRef, Component, ElementRef, Inject, inject, Injector, OnDestroy, OnInit, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroupDirective, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { isPlatformBrowser } from '@angular/common';
import { Meta } from '@angular/platform-browser';
import { LucideAngularModule } from 'lucide-angular';
import { DietService } from '../../../services/diet.service';
import { SeoService } from '../../../services/seo.service';
import { ToastService } from '../../../services/toastr.service';
declare let gtag: Function;

@Component({
  selector: 'dummyone',
  templateUrl: './dummyone.component.html',
  styleUrl: './dummyone.component.scss',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule]
})
export class DummyOneComponent implements OnInit, OnDestroy {
  /*   private destroy$ = new Subject<void>(); */
  private toast = inject(ToastService);
  @ViewChild(FormGroupDirective) formDirective!: FormGroupDirective;
  public isLoading: boolean = false;
  contactUsForm: any;
  count = 0;
  countSg = signal(0);
  increase() {
    this.count++;
  }

  private cdr = inject(ChangeDetectorRef);
  constructor(private fb: FormBuilder,
    private seoService: SeoService,
    private _dietService: DietService,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object) {
    this.contactUsForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]],
      subject: ['', Validators.required],
      message: ['', Validators.required],
      interest: ['', Validators.required],
    });
  }


  ngOnInit(): void {
    setTimeout(() => {

      this.count = 10;
      this.cdr.markForCheck();
    }, 4000);
    setTimeout(() => {
      this.countSg.set(10);
    }, 7000);
    // this.seoService.updateSeoTags({
    //   title: 'Contact Dr. meiheal Jha for Weight Loss & Nutrition Consultation',
    //   description: 'Ready to transform your health? Get in touch with Dr. meiheal Jha today. Book a customized  Health Store consultation via WhatsApp, call, or email.',
    //   url: 'https://www.meiheal.com/contactus',
    //   image: 'https://www.meiheal.com/landingth.webp'
    // });
    // // 2. Inject your Structured Data!

    // this.seoService.setStructuredData({
    //   "@context": "https://schema.org",
    //   "@type": "ContactPage",
    //   "name": "Contact Dr. meiheal Jha for Weight Loss & Nutrition Consultation",
    //   "url": "https://www.meiheal.com/contactus",
    //   "description": "Ready to transform your health? Get in touch with Dr. meiheal Jha today. Book a customized  Health Store consultation via WhatsApp, call, or email.",
    //   "mainEntity": {
    //     "@type": "Service",
    //     "name": "Mei Heal",
    //     "image": "https://www.meiheal.com/images/landingth.webp",
    //     "telephone": "+91-9354999067",

    //     "sameAs": [
    //       "https://www.facebook.com/profile.php?id=61590369990172",
    //       "https://instagram.com/meihealmeiheal",
    //       "https://www.linkedin.com/in/meiheal",
    //       "https://www.youtube.com/@meiheal",
    //       "https://x.com/meiheal"
    //     ],
    //     "contactPoint": {
    //       "@type": "ContactPoint",
    //       "telephone": "+91-9354999067",
    //       "contactType": "customer service",
    //       "availableLanguage": [
    //         "English",
    //         "Hindi"
    //       ]
    //     }
    //   }
    // });

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: 'Contact Dr. meiheal Jha for Weight Loss & Nutrition Consultation'
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: 'Ready to transform your health? Get in touch with Dr. meiheal Jha today. Book a customized  Health Store consultation via WhatsApp, call, or email.'
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: 'https://www.meiheal.com/landingth.webp'
    });

    this.meta.updateTag({
      name: 'twitter:url',
      content: 'https://www.meiheal.com/contactus'
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




  saveContact() {

    if (this.contactUsForm.invalid) {
      this.toast.showSuccess('Please fill all fields properly!');
      this.contactUsForm.markAllAsTouched();
      return;
    }
    this.contactApi(this.contactUsForm.value);

  }

  items = signal<string[]>([]);
  private injector = inject(Injector);
  @ViewChild('box') box!: ElementRef;
  @ViewChild('boxpare') boxpare!: ElementRef;

  add() {
    this.items.update(list => [...list, `Item ${list.length}`]);
    console.log('Last box height:', this.box?.nativeElement.offsetHeight);
    console.log('Last boxpare height:', this.boxpare?.nativeElement.offsetHeight);
    console.log('pre------------')
    afterNextRender(() => {
      console.log('Last box height:', this.box?.nativeElement.offsetHeight);
      console.log('Last boxpare height:', this.boxpare?.nativeElement.offsetHeight);
    }, { injector: this.injector });
  }

  contactApi(data: any) {
    this.isLoading = true;
    this._dietService.createLead(data).subscribe({
      next: res => {
        this.isLoading = false;
        this.toast.showSuccess('Message sent successfully!');
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'contcatus_click');

        if (this.formDirective) {
          // This clears the values AND wipes out the "submitted", "touched", and "dirty" states
          this.formDirective.resetForm();
        } else {
          // Fallback if the ViewChild isn't ready yet
          this.contactUsForm.reset();
        }
        // this._alertService.success('Lead Created placed successfully!');
      },
      error: err => {
        if (!!err.message)
          this.toast.showSuccess('Something wwent wrong !' + err.message);
        else
          this.toast.showSuccess('Something wwent wrong !');
        // this._alertService.error(err?.error?.message ? err.error.message : 'something went wrong');
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy() {
    /*     this.destroy$?.next();
        this.destroy$?.complete(); */

  }
}
