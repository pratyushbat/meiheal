import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddressFormComponent } from '../my-address-form/address-form.component';
import { AddressService } from '../../../services/address.service';
import { Address } from '../../../models/user.model';


@Component({
  selector: 'app-my-addresses',
  standalone: true,
  imports: [CommonModule, AddressFormComponent],
  template: `
      <section class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-xl font-semibold text-neutral-900 mb-6">My Addresses</h1>
 
      <div class="flex flex-col gap-3 mb-6">
        @for (addr of addresses(); track addr._id) {
          @if (editingId() === addr._id) {
            <div class="border border-neutral-200 rounded-2xl p-4">
              <app-address-form [initial]="addr" [showCancel]="true" (save)="onUpdate(addr._id, $event)" (onCancel)="editingId.set(null)" />
            </div>
          } @else {
            <div class="border border-neutral-200 rounded-2xl p-4 flex justify-between items-start gap-3">
              <div class="text-sm">
                <span class="block font-medium text-neutral-900">
                  {{ addr.fullName }} {{ addr.isDefault ? '· Default' : '' }}
                </span>
                <span class="block text-neutral-500">{{ addr.address }}{{ addr.landmark ? ', ' + addr.landmark : '' }}</span>
                <span class="block text-neutral-500">{{ addr.city }}, {{ addr.state }} - {{ addr.pincode }}</span>
                <span class="block text-neutral-500">{{ addr.phone }}</span>
              </div>
              <div class="flex flex-col items-end gap-1 text-sm">
                <button (click)="editingId.set(addr._id)" class="text-rose-600 font-medium">Edit</button>
                @if (!addr.isDefault) {
                  <button (click)="makeDefault(addr._id)" class="text-neutral-500">Set default</button>
                  <button (click)="remove(addr._id)" class="text-neutral-400">Delete</button>
                }
              </div>
            </div>
          }
        }
        @if (addresses().length === 0 && !isAdding()) {
          <p class="text-sm text-neutral-500">You haven't saved any addresses yet.</p>
        }
      </div>
 
      @if (isAdding()) {
        <div class="border border-neutral-200 rounded-2xl p-4">
          <app-address-form [showCancel]="true" (save)="onAdd($event)" (onCancel)="isAdding.set(false)" />
        </div>
      } @else {
        <button (click)="isAdding.set(true)"
          class="text-sm font-semibold text-rose-600 border border-rose-200 rounded-full px-5 py-2.5">
          + Add new address
        </button>
      }
    </section>

  `,
})
export class MyAddressesComponent implements OnInit {
  private addressService = inject(AddressService);


  addresses = signal<Address[]>([]);
  editingId = signal<string | null>(null);
  isAdding = signal(false);

  async ngOnInit() {
    this.addresses.set(await this.addressService.getMyAddresses());
  }

  async onAdd(payload: Omit<Address, '_id' | 'isDefault'>) {
    const created = await this.addressService.addAddress(payload);
    this.addresses.update(list => [...list, created]);
    this.isAdding.set(false);
  }

  async onUpdate(id: string, payload: Omit<Address, '_id' | 'isDefault'>) {
    const updated = await this.addressService.updateAddress(id, payload);
    this.addresses.update(list => list.map(a => (a._id === id ? updated : a)));
    this.editingId.set(null);
  }

  async makeDefault(id: string) {
    await this.addressService.setDefault(id);
    this.addresses.update(list => list.map(a => ({ ...a, isDefault: a._id === id })));
  }

  async remove(id: string) {
    await this.addressService.deleteAddress(id);
    this.addresses.update(list => list.filter(a => a._id !== id));
  }

}