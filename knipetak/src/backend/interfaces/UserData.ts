import { BookingData } from './BookingData';

export interface Location {
    address: string;
    city: string;
    postalCode: number;
}

// Defining so UserType can only be either "kunde" or "admin"
export enum UserType {
    CUSTOMER = "kunde",
    ADMIN = "admin",
}

// Interface that defines the structure for user data
export interface UserData {
    uid: string;
    displayName: string;
    email: string;
    age?: number;
    bookings?: BookingData[];
    healthIssues?: string;
    location?: Location;
    phoneNumber?: string;
    userType: UserType;
    createdAt: Date;
}