import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastService } from '../../../services/toastr.service';
import { DietService } from '../../../services/diet.service';
import { AlertService } from '../../../services/alert.service';


@Component({
  selector: 'app-contactus',
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss',
  standalone: false
})
export class AppointmentComponent implements OnInit, OnDestroy {
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
      this._alertService.error('Please fill all fields');
      return;
    }
    this.contactApi(this.contactUsForm.value);

  }


  contactApi(data: any) {
    this.isLoading = true;
    this._dietService.createLead(data).subscribe({
      next: res => {
        this.isLoading = false;
        this.toast.showSuccess('Lead Created  successfully!');
        // this._alertService.success('Lead Created placed successfully!');
      },
      error: err => {
        if(!!err.message)
        this.toast.showSuccess('Something wwent wrong !'+err.message);
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
