
import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
declare let gtag: Function;

@Component({
  selector: 'setup-password',
  templateUrl: './setup-password.component.html',
  styleUrls: ['./setup-password.component.scss'],
  standalone: true,
  imports:[CommonModule,ReactiveFormsModule]
})
export class SetupPasswordComponent implements OnInit {
  setupForm: FormGroup;
  token: string | null = null;
  type: string | null = null;
  errorMessage: string = '';
  isLoading: boolean = false;
  private platformId = inject(PLATFORM_ID);
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private _authService: AuthService
  ) {

    this.setupForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {

    // Grab the secure token from the URL (e.g., type=verif ?token=12345)
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.type = this.route.snapshot.queryParamMap.get('type');

    if (!this.token) {
      this.errorMessage = 'Invalid or missing link. Please check your email again.';
    }
    if (this.type == 'verifyPwd') {
      this.verifyPwdAccount();
    }
  }

  // Custom validator to ensure passwords match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.setupForm.invalid || !this.token) return;

    this.isLoading = true;
    const newPassword = this.setupForm.value.password;


    // TODO: Call your backend API with the token and new password

    switch (this.type) {
      case 'loginTemp':
        this.upgradeTempTokenAccount(newPassword);
        break;

      case 'resetPwd':
        this.upgradeResetPwdAccount(newPassword);
        break;

      case 'verifyPwd':
        this.verifyPwdAccount();
        break;
    }

  }

  upgradeTempTokenAccount(newPassword) {
    this._authService.upgradeTempTokenAccount(this.token, newPassword).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'tempreset_click');
        this.isLoading = false;
        // Redirect to login on success
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to set password. The link may have expired.';
      }
    });
  }

  upgradeResetPwdAccount(newPassword) {
    const confirm_password = this.setupForm.value.confirmPassword;
    this._authService.resetPwdAccount(this.token, newPassword, confirm_password).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'tempreset_click');
        this.isLoading = false;
        // Redirect to login on success
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to set password. The link may have expired.';
      }
    });
  }


  verifyPwdAccount() {
    this._authService.verifyUserAccount(this.token).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId) && typeof gtag === 'function')
          gtag('event', 'verifyUserclick');
        this.isLoading = false;
        // Redirect to login on success
        this.router.navigate(['dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to set password. The link may have expired.';
      }
    });
  }

}
