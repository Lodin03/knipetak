import { Location } from "./Location";

// Defining so UserType can only be either "kunde" or "admin"
export enum UserType {
  CUSTOMER = "kunde",
  ADMIN = "admin",
}

export enum Gender {
  MALE = "Mann",
  FEMALE = "Kvinne",
  OTHER = "Annet",
}

// Interface that defines the structure for user data
export interface UserData {
  uid: string;
  displayName: string;
  email: string;
  age?: number;
  gender?: Gender;
  healthIssues?: string;
  location?: Location;
  phoneNumber?: string;
  userType: UserType;
  createdAt: Date;
}
