import EventDetails from "../EventDetails";

// This is what we return when asking for available time slots on a specific day

export default interface AvailabilityResult {
  location: string | null;
  availableSlots: string[];
  eventDetails: EventDetails | null;
}
