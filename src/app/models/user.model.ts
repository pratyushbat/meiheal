export interface UserLocationData {
    ip: string;
    city: string;
    region: string;
    country: string;
    loc: string;
    org: string;
    postal: string;
    timezone: string;
}

export interface Address {
    fullName: string;
    phone: string;
    address: string;
    landmark: string;
    pincode: string;
    locality: string;
    city: string;
    state: string;
    country: string;
    isDefault: boolean;
    // plainPackaging: boolean; // ← add this

    _id: string;
}
export type UserRole = 'user' | 'admin' | 'moderator' | 'guest';
export interface User {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    profilePic: string;
    email: string;
    verified?: boolean;
    role: UserRole;
    userLocationData: UserLocationData;
    isGuest: boolean;
    addresses: Address[];
}
export interface UserRes {
    success: boolean;
    userData: User;

}


export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: UserRole,
    password: string;
    confirm_password: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}