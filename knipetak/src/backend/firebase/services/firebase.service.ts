import { getFirestore, collection, getDocs } from "firebase/firestore";
import app from "../firebase.ts";

// Defining so that Booking is an array
export interface Booking {
    bookingId: string; 
    date: string;
    service: string;
}

// Defining so UserType can only be either "customer" or "admin"
export enum UserType {
    CUSTOMER = "customer",
    ADMIN = "admin",
  }

// Define the data structure
export interface UserData {
    id: string;
    age: number;
    bookings: Booking[];
    healthIssues: string;
    location: string;
    phoneNumber: string; // Because of country code (example +47)
    userType: UserType[]; 
}

// Firestore instance
const db = getFirestore(app);

// Function to fetch users collection from Firestore
export const fetchUsers = async (): Promise<UserData[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<UserData, "id">),
    }));
  } catch (error) {
    console.error("Error fetching Firestore data:", error);
    throw error; // Ensure the error is handled properly
  }
};
