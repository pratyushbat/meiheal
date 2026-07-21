import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Address } from '../models/user.model';

// These map to whatever routes sit on top of IUser.addresses (a DocumentArray
// on the user document). Replace the paths/response-unwrapping with whatever
// your API actually returns.
@Injectable({ providedIn: 'root' })
export class AddressService {
    private http = inject(HttpClient);
    private base = '/api/users/me/addresses';

    async getMyAddresses(): Promise<Address[]> {
        return firstValueFrom(this.http.get<Address[]>(this.base));
    }

    async addAddress(payload: Omit<Address, '_id' | 'isDefault'>): Promise<Address> {
        return firstValueFrom(this.http.post<Address>(this.base, payload));
    }

    async updateAddress(id: string, payload: Partial<Address>): Promise<Address> {
        return firstValueFrom(this.http.patch<Address>(`${this.base}/${id}`, payload));
    }

    async deleteAddress(id: string): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.base}/${id}`));
    }

    async setDefault(id: string): Promise<Address> {
        return firstValueFrom(this.http.patch<Address>(`${this.base}/${id}/default`, {}));
    }
}