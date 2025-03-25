import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import app from "../firebase";
import BookingData from "../../interfaces/BookingData";

const db = getFirestore(app);

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
  treatmentId: string;
}

/**
 * Creates a new booking in the Firestore "bookings" collection.
 * The `bookingData` parameter should include all properties defined in BookingData.
 * The `createdAt` field will be automatically set to Firestore's server timestamp.
 */
export const createBooking = async (
  bookingData: BookingData
): Promise<string> => {
  try {
    const bookingWithTimestamp = {
      ...bookingData,
      createdAt: serverTimestamp(),
    };
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

/**
 * Fetches all bookings for a specific user from Firestore
 */
export const getUserBookings = async (userId: string): Promise<BookingData[]> => {
  try {
    console.log('Fetching bookings for user:', userId);
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("customerId", "==", userId)
    );
    
    console.log('Executing Firestore query...');
    const querySnapshot = await getDocs(q);
    console.log(`Found ${querySnapshot.size} bookings`);
    
    const bookings: BookingData[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Raw booking data:', data);
      
      try {
        // Convert Firestore Timestamps to Dates
        const booking: BookingData = {
          ...data,
          date: data.date?.toDate?.() || new Date(),
          timeslot: {
            start: data.timeslot?.start?.toDate?.() || new Date(),
            end: data.timeslot?.end?.toDate?.() || new Date()
          }
        } as BookingData;
        console.log('Processed booking:', booking);
        bookings.push(booking);
      } catch (error) {
        console.error('Error processing booking:', error, 'Raw data:', data);
      }
    });
    
    // Sort bookings by date manually
    bookings.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    console.log('Final bookings array:', bookings);
    return bookings;
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    throw error;
  }
};
