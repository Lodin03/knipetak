import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  getDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import app from "../firebase";

const db = getFirestore(app);

interface WorkHours {
  start: string;
  end: string;
}

interface OverrideData {
  workhours: WorkHours;
  location: string;
  eventId?: string;
}

interface EventDetails {
  [key: string]: unknown;
}

interface WeeklySchedule {
  [day: string]: {
    workhours: WorkHours;
    location: string;
  };
}

interface DefaultAvailability {
  weeklySchedule: WeeklySchedule;
}

interface AvailabilityResult {
  location: string | null;
  availableSlots: string[];
  eventDetails: EventDetails | null;
}

/**
 * Returns the number of hours offset for Norway on a given date.
 * For example, if the timeZoneName is "CET" returns 1, if "CEST" returns 2.
 */
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

/**
 * Given a date string in "YYYY-MM-DD", returns the start and end of day boundaries
 * in UTC corresponding to midnight in the Norwegian timezone.
 *
 * For example, for "2025-03-11" during CET (offset 1):
 *   startOfDay: 2025-03-10T23:00:00.000Z  (i.e. 00:00 in Oslo)
 *   endOfDay:   2025-03-11T23:00:00.000Z
 */
function getOsloDayBounds(dateStr: string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  const [year, month, day] = dateStr.split("-").map(Number);
  // Create a temporary date from the string (assumes local interpretation)
  const tempDate = new Date(dateStr + "T00:00:00");
  const osloOffset = getOsloOffsetForDate(tempDate); // e.g. 1 for CET, 2 for CEST

  // For midnight in Oslo (00:00 local), the UTC time is 00:00 minus the offset.
  const startOfDay = new Date(
    Date.UTC(year, month - 1, day, 0 - osloOffset, 0, 0)
  );
  const endOfDay = new Date(
    Date.UTC(year, month - 1, day + 1, 0 - osloOffset, 0, 0)
  );
  return { startOfDay, endOfDay };
}

/**
 * Utility function to generate 30-minute time slots.
 */
const generateTimeSlots = (
  start: string,
  end: string,
  bookedSlots: string[]
): string[] => {
  const slots: string[] = [];
  const startTime = new Date(`1970-01-01T${start}:00`);
  const endTime = new Date(`1970-01-01T${end}:00`);

  for (
    let time = startTime;
    time < endTime;
    time = new Date(time.getTime() + 30 * 60000)
  ) {
    const timeStr = time.toTimeString().substring(0, 5); // "HH:MM"
    if (!bookedSlots.includes(timeStr)) {
      slots.push(timeStr);
    }
  }
  return slots;
};

/**
 * Fetch available slots for a given date (YYYY-MM-DD).
 * Expects Firestore `date` fields to be stored as Timestamps.
 */
export const getAvailableSlotsByDate = async (
  dateStr: string
): Promise<AvailabilityResult | null> => {
  try {
    console.log(`🔍 Fetching availability for ${dateStr}`);

    let workHours: WorkHours | null = null;
    let location: string | null = null;
    let eventDetails: EventDetails | null = null;

    // Calculate Norwegian day bounds based on the provided date string.
    const { startOfDay, endOfDay } = getOsloDayBounds(dateStr);
    console.log(`Oslo startOfDay (UTC): ${startOfDay.toISOString()}`);
    console.log(`Oslo endOfDay (UTC): ${endOfDay.toISOString()}`);

    // STEP 1: Check for an override on this calendar day.
    console.log(`🔎 Checking for overrides for ${dateStr}`);
    console.log(
      "Override query: timestamps between",
      startOfDay.toISOString(),
      "and",
      endOfDay.toISOString()
    );
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
      location = overrideData.location;

      if (overrideData.eventId) {
        console.log(
          `Fetching event details for eventId: ${overrideData.eventId}`
        );
        const eventRef = doc(db, "events", overrideData.eventId);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          eventDetails = eventDoc.data() as EventDetails;
          console.log("Event details:", eventDetails);
        } else {
          console.warn(
            "No event details found for eventId:",
            overrideData.eventId
          );
        }
      }
    } else {
      console.log("No override found. Falling back to default schedule.");
      // Use the English weekday from the Oslo midnight.
      const englishDay = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        timeZone: "Europe/Oslo",
      }).format(startOfDay);
      const dayKey = englishDay.toLowerCase(); // e.g. "tuesday"
      console.log(`📆 Checking default schedule for: ${dayKey}`);

      const defaultRef = doc(db, "defaultAvailability", "default_workhours");
      const defaultDoc = await getDoc(defaultRef);
      if (!defaultDoc.exists()) {
        console.warn("⚠️ No default schedule found.");
        return null;
      }

      const defaultData = defaultDoc.data() as DefaultAvailability;
      console.log("Default schedule data:", defaultData);

      if (defaultData.weeklySchedule[dayKey]) {
        workHours = defaultData.weeklySchedule[dayKey].workhours;
        location = defaultData.weeklySchedule[dayKey].location;
      } else {
        console.warn(`⚠️ No default work hours found for ${dayKey}`);
        return null;
      }
    }

    if (!workHours) {
      console.error(`🚨 Invalid work hours format for ${dateStr}:`, workHours);
      return null;
    }
    console.log(`✅ Work hours for ${dateStr}:`, workHours);

    // STEP 3: Fetch booked slots for this date.
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

    const bookedSlots = bookingsSnapshot.docs.map(
      (doc) => (doc.data().timeSlot as { start: string }).start
    );
    console.log(`Booked slots for ${dateStr}:`, bookedSlots);

    // STEP 4: Generate available time slots dynamically.
    const availableSlots = generateTimeSlots(
      workHours.start,
      workHours.end,
      bookedSlots
    );
    console.log(`Available slots for ${dateStr}:`, availableSlots);

    return {
      location,
      availableSlots,
      eventDetails,
    };
  } catch (error) {
    console.error("❌ Error fetching available slots:", error);
    throw error;
  }
};
