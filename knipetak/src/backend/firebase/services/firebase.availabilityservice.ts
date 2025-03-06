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
 */
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
      location = overrideData.location;

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
    // Using 15-minute increments ensures we can capture a slot like "17:15" if booking.end + travelBuffer equals that.
    const bookedSlots: string[] = [];
    bookingsSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Use the correct field "timeslot"
      const timeslot = data.timeslot;
      if (timeslot && timeslot.start && timeslot.end) {
        const startTime = timeslot.start.toDate
          ? timeslot.start.toDate()
          : new Date(timeslot.start);
        const endTime = timeslot.end.toDate
          ? timeslot.end.toDate()
          : new Date(timeslot.end);
        // Calculate the blocking end time (non-inclusive)
        const blockingEndTime = new Date(
          endTime.getTime() + travelBuffer * 60000
        );
        // Generate 15-minute increments
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

    // STEP 3: Generate available slots using a 15-minute increment.
    const availableSlots = generateTimeSlots(
      workHours.start,
      workHours.end,
      bookedSlots,
      15 // Use 15-minute increments
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
