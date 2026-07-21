import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { DietService } from '../../../services/diet.service';
import { AlertService } from '../../../services/alert.service';
import { ToastService } from '../../../services/toastr.service';

@Component({
  selector: 'app-upgradeuser',
  templateUrl: './upgrade-user.component.html',
  styleUrl: './upgrade-user.component.scss',
  standalone: false
})
export class UpgradeUserComponent implements OnInit, OnDestroy {
  /*   private destroy$ = new Subject<void>(); */
  private toast = inject(ToastService);
  public isLoading: boolean = false;
  contactUsForm: any;
  constructor(private fb: FormBuilder,
    private _dietService: DietService,
    private _alertService: AlertService) {
    this.contactUsForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      phone: ['', Validators.required],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }


  ngOnInit(): void {

  }




  saveContact() {

    if (this.contactUsForm.invalid) {
      this.toast.showSuccess('Please fill all fields');
      return;
    }
    this.contactApi(this.contactUsForm.value);

  }


  contactApi(data: any) {
    this.isLoading = true;
    this._dietService.createLead(data).subscribe({
      next: res => {
        this.isLoading = false;
        this.toast.showSuccess('Lead created successfully!!');
      },
      error: err => {
        this.toast.showSuccess(err?.error?.message ? err.error.message : 'something went wrong');
        this.isLoading = false;
      },
    });
  }

  ngOnDestroy() {
    /*     this.destroy$?.next();
        this.destroy$?.complete(); */

  }
}
