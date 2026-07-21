import { Component, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Address } from '../../../models/user.model';

@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
        <div class="flex flex-col gap-3">
      <input type="text" [(ngModel)]="fullName" placeholder="Full name"
        class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full" />
      <input type="tel" [(ngModel)]="phone" placeholder="Phone number"
        class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full" />
      <input type="text" [(ngModel)]="address" placeholder="Flat / house no., building, street"
        class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full" />
      <input type="text" [(ngModel)]="landmark" placeholder="Landmark / area (optional)"
        class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 w-full" />
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input type="text" [(ngModel)]="city" placeholder="City"
          class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5" />
        <select [(ngModel)]="state" class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5 bg-white">
          <option value="" disabled>State</option>
          @for (s of indianStates; track s) { <option [value]="s">{{ s }}</option> }
        </select>
        <input type="text" [(ngModel)]="pincode" maxlength="6" placeholder="Pincode"
          class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5" />
        <input type="text" [(ngModel)]="locality" maxlength="6" placeholder="Localityy"
          class="text-sm border border-neutral-300 rounded-lg px-3 py-2.5" />
      </div>
      <div class="flex justify-end gap-2 mt-1">
        @if (showCancel()) {
          <button type="button" (click)="onCancel.emit()"
            class="text-sm font-medium text-neutral-600 px-4 py-2.5">Cancel</button>
        }
        <button type="button" [disabled]="!isValid()" (click)="submit()"
          class="bg-rose-600 disabled:bg-neutral-200 disabled:text-neutral-400 text-white text-sm font-semibold px-5 py-2.5 rounded-full">
          {{ initial() ? 'Save changes' : 'Add address' }}
        </button>
      </div>
    </div>

  `,
})
export class AddressFormComponent {
  // Pass an existing address to edit it; leave undefined for "add new".
  initial = input<Address | undefined>();
  showCancel = input(false); // set true when used inside an edit/inline context that needs a Cancel button
  save = output<Omit<Address, '_id' | 'isDefault'>>();
  onCancel = output<void>();

  fullName = signal(''); phone = signal(''); address = signal(''); locality = signal('');
  landmark = signal(''); city = signal(''); state = signal('');
  pincode = signal(''); country = signal('India');

  indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep', 'Puducherry',
  ];

  constructor() {
    effect(() => {
      const addr = this.initial();
      if (!addr) return;
      this.fullName.set(addr.fullName); this.phone.set(addr.phone);
      this.address.set(addr.address); this.landmark.set(addr.landmark ?? '');
      this.city.set(addr.city); this.state.set(addr.state);
      this.pincode.set(addr.pincode); this.country.set(addr.country ?? 'India');
    });
  }

  isValid(): boolean {
    return !!(this.fullName() && this.phone() && this.address() &&
      this.city() && this.state() && this.pincode().length === 6);
  }

  submit() {
    this.save.emit({
      fullName: this.fullName(), phone: this.phone(), address: this.address(),
      landmark: this.landmark(), city: this.city(), state: this.state(), locality: this.locality(),
      pincode: this.pincode(), country: this.country(),
    });
  }

}