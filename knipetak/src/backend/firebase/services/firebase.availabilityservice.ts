import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  Timestamp,
  setDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import app from "../firebase";

import WorkHours from "../../interfaces/availabilityInterfaces/WorkHours";
import OverrideData from "../../interfaces/availabilityInterfaces/OverrideData";
import EventDetails from "../../interfaces/availabilityInterfaces/EventDetails";
import WeeklySchedule from "../../interfaces/availabilityInterfaces/WeeklySchedule";
import DefaultAvailability from "../../interfaces/availabilityInterfaces/DefaultAvailability";
import AvailabilityResult from "../../interfaces/availabilityInterfaces/AvailabilityResult";

const db = getFirestore(app);

// Get how many hours Norway (Oslo) is ahead of UTC on a specific date
function getOsloOffsetForDate(date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Oslo",
    timeZoneName: "short",
  });
  const parts = dtf.formatToParts(date);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value;
  if (tzName === "CET") return 1;
  if (tzName === "CEST") return 2;
  return 1; // fallback
}

// Get the exact start and end of a day in Norwegian time (converted to UTC)
function getOsloDayBounds(dateStr: string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const [year, month, day] = dateStr.split("-").map(Number);
  const tempDate = new Date(dateStr + "T00:00:00");
  const osloOffset = getOsloOffsetForDate(tempDate);
  const startOfDay = new Date(
    Date.UTC(year, month - 1, day, 0 - osloOffset, 0, 0)
  );
  const endOfDay = new Date(
    Date.UTC(year, month - 1, day + 1, 0 - osloOffset, 0, 0)
  );
  return { startOfDay, endOfDay };
}

/**
 * Utility function to generate time slots.
 * The slots are generated from start to end with a given interval (in minutes),
 * excluding any slots whose time strings appear in the bookedSlots array.
 */
const generateTimeSlots = (
  start: string,
  end: string,
  bookedSlots: string[],
  interval: number = 30
): string[] => {
  const slots: string[] = [];
  const startTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  for (
    let time = startTime;
    time < endTime;
    time = new Date(time.getTime() + interval * 60000)
  ) {
    const timeStr = time.toTimeString().substring(0, 5); // "HH:MM"
    if (!bookedSlots.includes(timeStr)) {
      slots.push(timeStr);
    }
  }
  return slots;
};

// Get available slots for a specific date
export const getAvailableSlotsByDate = async (
  dateStr: string
): Promise<AvailabilityResult | null> => {
  try {
    console.log(`🔍 Fetching availability for ${dateStr}`);

    let workHours: WorkHours | null = null;
    let eventDetails: EventDetails | null = null;

    // Calculate Norwegian day boundaries
    const { startOfDay, endOfDay } = getOsloDayBounds(dateStr);
    console.log(`Oslo startOfDay (UTC): ${startOfDay.toISOString()}`);
    console.log(`Oslo endOfDay (UTC): ${endOfDay.toISOString()}`);

    // STEP 1: Check for an override on this day.
    console.log(`🔎 Checking for overrides for ${dateStr}`);
    const overrideQuery = query(
      collection(db, "availibilityOverrides"),
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<", Timestamp.fromDate(endOfDay))
    );
    const overrideSnapshot = await getDocs(overrideQuery);
    console.log(
      `Override query returned ${overrideSnapshot.size} document(s).`
    );

    if (!overrideSnapshot.empty) {
      console.log(`✅ Override found for ${dateStr}`);
      const overrideData = overrideSnapshot.docs[0].data() as OverrideData;
      console.log("Override document data:", overrideData);
      workHours = overrideData.workhours;

      if (overrideData.eventId) {
        const eventRef = doc(db, "events", overrideData.eventId);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          eventDetails = eventDoc.data() as EventDetails;
        }
      }
    } else {
      console.log("No override found. Falling back to default schedule.");
      const englishDay = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Europe/Oslo",
      }).format(startOfDay);
      const dayKey = englishDay.toLowerCase();
      const defaultRef = doc(db, "defaultAvailability", "default_workhours");
      const defaultDoc = await getDoc(defaultRef);
      if (!defaultDoc.exists()) {
        console.warn("⚠️ No default schedule found.");
        return null;
      }
      const defaultData = defaultDoc.data() as DefaultAvailability;
      if (defaultData.weeklySchedule[dayKey]) {
        workHours = defaultData.weeklySchedule[dayKey].workhours;
      } else {
        console.warn(`⚠️ No default work hours found for ${dayKey}`);
        return null;
      }
    }

    if (!workHours || !workHours.timeSlots.length) {
      console.error(`🚨 Invalid work hours format for ${dateStr}:`, workHours);
      return null;
    }
    console.log(`✅ Work hours for ${dateStr}:`, workHours);

    // STEP 2: Fetch booked slots for this day.
    const bookingsRef = collection(db, "bookings");
    const bookingsQueryRef = query(
      bookingsRef,
      where("date", ">=", Timestamp.fromDate(startOfDay)),
      where("date", "<", Timestamp.fromDate(endOfDay))
    );
    const bookingsSnapshot = await getDocs(bookingsQueryRef);
    console.log(
      `Bookings query returned ${bookingsSnapshot.size} document(s).`
    );

    // Define a travel buffer in minutes (e.g. 15 minutes)
    const travelBuffer = 15;

    // For each booking, generate 15-minute increments from booking.start to booking.end + travelBuffer.
    const bookedSlots: string[] = [];
    bookingsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const timeslot = data.timeslot;
      if (timeslot && timeslot.start && timeslot.end) {
        const startTime = timeslot.start.toDate
          ? timeslot.start.toDate()
          : new Date(timeslot.start);
        const endTime = timeslot.end.toDate
          ? timeslot.end.toDate()
          : new Date(timeslot.end);
        const blockingEndTime = new Date(
          endTime.getTime() + travelBuffer * 60000
        );
        // Generates 15-minute increments
        for (
          let t = new Date(startTime);
          t < blockingEndTime;
          t = new Date(t.getTime() + 15 * 60000)
        ) {
          const timeStr = t.toTimeString().substring(0, 5);
          bookedSlots.push(timeStr);
        }
      }
    });
    console.log(`Booked slots for ${dateStr}:`, bookedSlots);

    // STEP 3: Generate available slots for each work hour time slot
    const availabilityByLocation = workHours.timeSlots
      .map((timeSlot) => {
        const availableSlots = generateTimeSlots(
          timeSlot.start.toTimeString().substring(0, 5),
          timeSlot.end.toTimeString().substring(0, 5),
          bookedSlots,
          15 // increment of 15 minutes
        );

        return {
          location: timeSlot.location,
          availableSlots,
          workHours: timeSlot
        };
      })
      .filter((slot) => slot.availableSlots.length > 0);

    return {
      availabilityByLocation,
      eventDetails,
    };
  } catch (error) {
    console.error("❌ Error fetching available slots:", error);
    throw error;
  }
};

/**
 * Sets the default weekly schedule for work hours
 */
export async function setDefaultWorkHours(
  weeklySchedule: WeeklySchedule
): Promise<void> {
  try {
    const defaultRef = doc(db, "defaultAvailability", "default_workhours");
    await setDoc(defaultRef, { weeklySchedule }, { merge: true });
    console.log("✅ Default work hours updated successfully");
  } catch (error) {
    console.error("❌ Error setting default work hours:", error);
    throw error;
  }
}

/**
 * Retrieves the default weekly workhour schedule from Firebase
 */
export async function getDefaultWorkHours(): Promise<WeeklySchedule | null> {
  try {
    const defaultRef = doc(db, "defaultAvailability", "default_workhours");
    const defaultDoc = await getDoc(defaultRef);

    if (!defaultDoc.exists()) {
      console.warn("⚠️ No default work hours found");
      return null;
    }

    const data = defaultDoc.data() as DefaultAvailability;
    return data.weeklySchedule;
  } catch (error) {
    console.error("❌ Error getting default work hours:", error);
    throw error;
  }
}

/**
 * Creates an override for a specific date
 */
export async function createWorkHoursOverride(
  date: Date,
  workhours: WorkHours,
  location: string,
  eventId?: string
): Promise<string> {
  try {
    const override = {
      date: Timestamp.fromDate(date),
      workhours,
      location,
      ...(eventId && { eventId }),
    };

    const docRef = await addDoc(
      collection(db, "availibilityOverrides"),
      override
    );
    console.log("✅ Work hours override created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Error creating work hours override:", error);
    throw error;
  }
}

/**
 * Gets all overrides for a date range
 */
export async function getWorkHoursOverrides(
  startDate: Date,
  endDate: Date
): Promise<(OverrideData & { id: string; date: Date })[]> {
  try {
    const overridesQuery = query(
      collection(db, "availibilityOverrides"),
      where("date", ">=", Timestamp.fromDate(startDate)),
      where("date", "<=", Timestamp.fromDate(endDate))
    );

    const snapshot = await getDocs(overridesQuery);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp).toDate(),
    })) as (OverrideData & { id: string; date: Date })[];
  } catch (error) {
    console.error("❌ Error getting work hours overrides:", error);
    throw error;
  }
}

/**
 * Deletes a specific override by ID
 */
export async function deleteWorkHoursOverride(
  overrideId: string
): Promise<void> {
  try {
    const overrideRef = doc(db, "availibilityOverrides", overrideId);
    await deleteDoc(overrideRef);
    console.log("✅ Work hours override deleted successfully");
  } catch (error) {
    console.error("❌ Error deleting work hours override:", error);
    throw error;
  }
}
