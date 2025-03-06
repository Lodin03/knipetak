import TimeSlot from "./timeSlot";

interface Availability {
  id?: string;
  date: string;
  location: string;
  timeSlots: TimeSlot[];
  status: "open" | "booked" | "unavailable";
  source: "manual" | "google_calendar";
}

export default Availability;
