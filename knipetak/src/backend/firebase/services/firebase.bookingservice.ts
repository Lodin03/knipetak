import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

/**
 * Define the shape of a booking's timeslot.
 * The timeslot fields can be either JavaScript Date objects or Firestore Timestamps.
 */
export interface BookingTimeslot {
  start: Date | Timestamp;
  end: Date | Timestamp;
}

/**
 * Booking interface representing the structure of a booking document.
 */
export interface Booking {
  createdAt: Timestamp; // Automatically set by Firestore
  customerId: string; // "Hentes fra innlogget brukers kunde"
  date: Date | Timestamp; // The date of the booking (appointment)
  duration: number; // Duration in minutes (e.g. 60)
  location: string; // E.g. "Haukeland"
  paymentStatus: string; // E.g. "paid"
  price: number; // E.g. 1550
  status: string; // E.g. "pending"
  timeslot: BookingTimeslot; // Start and end times as timestamps
  treatmentId: string; // E.g. "deep_tissue"
}

/**
 * Creates a new booking in the Firestore "bookings" collection.
 * The `bookingData` parameter should include all booking properties except `createdAt`,
 * which will be automatically set to Firestore's server timestamp.
 *
 * @param bookingData - The data for the booking (excluding createdAt)
 * @returns The document ID of the created booking.
 */
export const createBooking = async (
  bookingData: Omit<Booking, "createdAt">
): Promise<string> => {
  try {
    // Prepare the booking object with a server-generated timestamp
    const bookingWithTimestamp = {
      ...bookingData,
      createdAt: serverTimestamp(),
    };

    // Add the booking to the "bookings" collection
    const docRef = await addDoc(
      collection(db, "bookings"),
      bookingWithTimestamp
    );
    console.log("Booking created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};
