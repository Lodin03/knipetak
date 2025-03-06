import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import app from "../firebase";
import Availability from "../../interfaces/availability";
const db = getFirestore(app);
const availabilityCollection = "availability";

export const addAvailability = async (
  availability: Omit<Availability, "id">
) => {
  try {
    const docRef = await addDoc(
      collection(db, availabilityCollection),
      availability
    );
    console.log("Availability added with ID: ", docRef.id);
    return { ...availability, id: docRef.id };
  } catch (error) {
    console.error("Error adding availability: ", error);
    throw error;
  }
};

export const getAvailabilityByDateWithBookings = async (date: string) => {
  try {
    const q = query(
      collection(db, availabilityCollection),
      where("date", "==", date),
      where("status", "==", "open") // Henter kun åpne tider
    );
    const querySnapshot = await getDocs(q);

    const availability = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Availability)
    );

    // Sjekk eksisterende bookinger for denne datoen
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("date", "==", date),
      where("status", "==", "confirmed")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);

    const bookedSlots = bookingsSnapshot.docs.map((doc) => doc.data().timeSlot);

    // Filtrer bort tidspunkter som allerede er booket
    availability.forEach((slot) => {
      slot.timeSlots = slot.timeSlots.filter(
        (timeSlot) =>
          !bookedSlots.some(
            (booked) =>
              booked.start === timeSlot.start && booked.end === timeSlot.end
          )
      );
    });

    return availability;
  } catch (error) {
    console.error("Error getting availability with bookings: ", error);
    throw error;
  }
};

export const getAvailabilityByLocation = async (location: string) => {
  try {
    const q = query(
      collection(db, availabilityCollection),
      where("location", "==", location)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Availability)
    );
  } catch (error) {
    console.error("Error getting availability: ", error);
    throw error;
  }
};

export const updateAvailabilityStatus = async (
  id: string,
  status: Availability["status"]
) => {
  try {
    const availabilityRef = doc(db, availabilityCollection, id);
    await updateDoc(availabilityRef, { status });
    console.log("Availability status updated successfully");
  } catch (error) {
    console.error("Error updating availability status: ", error);
    throw error;
  }
};

export const deleteAvailability = async (id: string) => {
  try {
    const availabilityRef = doc(db, availabilityCollection, id);
    await deleteDoc(availabilityRef);
    console.log("Availability deleted successfully");
  } catch (error) {
    console.error("Error deleting availability: ", error);
    throw error;
  }
};

export const getAvailabilityByDateRange = async (
  startDate: string,
  endDate: string
) => {
  try {
    const q = query(
      collection(db, availabilityCollection),
      where("date", ">=", startDate),
      where("date", "<=", endDate)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Availability)
    );
  } catch (error) {
    console.error("Error getting availability range: ", error);
    throw error;
  }
};

export const getWorkHoursByDate = async (date: string) => {
  try {
    const dayOfWeek = new Date(date)
      .toLocaleString("en-US", {
        weekday: "long",
      })
      .toLowerCase();

    const workHoursRef = doc(db, "workHours", "default_work_hours");
    const workHoursDoc = await getDoc(workHoursRef);

    if (!workHoursDoc.exists()) {
      return null;
    }

    const workHours = workHoursDoc.data();

    return workHours.days[dayOfWeek] || null;
  } catch (error) {
    console.error("Error getting work hours: ", error);
    throw error;
  }
};
