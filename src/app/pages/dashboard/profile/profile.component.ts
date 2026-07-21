
import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toastr.service';
import { RouterModule } from '@angular/router';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports:[RouterModule,UpperCasePipe]
})
export class ProfileComponent implements OnInit {
  _authService = inject(AuthService);
  private toast = inject(ToastService);


  public isEditing = signal(false);

  toggleEdit() {
    this.isEditing.update(v => !v);
  }

  saveProfile() {


    // Turn off edit mode when done
    this.isEditing.set(false);
  }


  ngOnInit(): void {

  }


}
